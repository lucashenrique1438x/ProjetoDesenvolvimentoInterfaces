using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Nodes;

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);

// Configuração das políticas de segurança CORS (Cross-Origin Resource Sharing)
// link explicando o CORS: https://learn.microsoft.com/pt-br/aspnet/core/security/cors?view=aspnetcore-10.0
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          // Definição das origens permitidas, cabeçalhos e métodos HTTP aceitos
                          policy.WithOrigins("http://localhost:8080",
                                             "http://127.0.0.1:8080")
                                .AllowAnyHeader()
                                .WithMethods("GET");
                      });
});

// Registro do serviço IHttpClientFactory para gerenciamento de requisições HTTP externas
builder.Services.AddHttpClient();

var app = builder.Build();

// Aplicação do middleware de CORS baseado na política registrada
app.UseCors(MyAllowSpecificOrigins);

// Endpoint proxy para resolução do código IBGE/DataSUS do município solicitado
app.MapGet("/api/municipio", async (string municipio, string uf, IHttpClientFactory clientFactory) =>
{
    var client = clientFactory.CreateClient();
    var url = $"https://apidadosabertos.saude.gov.br/macrorregiao-e-regiao-de-saude/municipio?municipio={Uri.EscapeDataString(municipio)}&sigla_uf={uf}&limit=1&offset=0";
    
    var response = await client.GetAsync(url);
    var content = await response.Content.ReadAsStringAsync();
    
    return Results.Content(content, "application/json");
});

// Endpoint proxy com paginação sequencial integrada para consolidação de estabelecimentos de saúde
app.MapGet("/api/estabelecimentos", async (string codigo_municipio, IHttpClientFactory clientFactory) =>
{
    var client = clientFactory.CreateClient();
    
    // Parâmetros de controle para limitação e paginação da API externa
    const int limitePorPagina = 20; 
    const int metaTotalEstabelecimentos = 100; 
    
    int offsetAtual = 0;
    var listaConsolidada = new JsonArray();
    bool possuiMaisRegistros = true;

    // Laço de repetição para requisições sucessivas baseado no limite e offset da API de origem
    while (possuiMaisRegistros && listaConsolidada.Count < metaTotalEstabelecimentos)
    {
        var url = $"https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_municipio={codigo_municipio}&limit={limitePorPagina}&offset={offsetAtual}";
        
        var response = await client.GetAsync(url);
        if (!response.IsSuccessStatusCode) break;

        var content = await response.Content.ReadAsStringAsync();
        
        using (JsonDocument doc = JsonDocument.Parse(content))
        {
            // Validação estrutural do nó de dados esperado no JSON de resposta
            if (doc.RootElement.TryGetProperty("estabelecimentos", out JsonElement estabelecimentosProp) && 
                estabelecimentosProp.ValueKind == JsonValueKind.Array)
            {
                int quantidadeNaPagina = 0;

                foreach (var est in estabelecimentosProp.EnumerateArray())
                {
                    // Interrupção do processamento caso o teto máximo de registros seja atingido
                    if (listaConsolidada.Count >= metaTotalEstabelecimentos) break;

                    // Conversão de JsonElement estrutural para JsonNode mutável
                    var nóNode = JsonNode.Parse(est.GetRawText());
                    if (nóNode != null)
                    {
                        listaConsolidada.Add(nóNode);
                        quantidadeNaPagina++;
                    }
                }

                // Critério de parada por exaustão de registros na API de origem
                if (quantidadeNaPagina < limitePorPagina)
                {
                    possuiMaisRegistros = false;
                }
            }
            else
            {
                possuiMaisRegistros = false;
                break;
            }
        }

        // Incremento do offset com base no multiplicador de registros por página
        offsetAtual += limitePorPagina;
    }

    // Estruturação do payload de saída para manutenção de compatibilidade com o contrato do frontend
    var resultadoFinal = new JsonObject
    {
        ["estabelecimentos"] = listaConsolidada
    };

    return Results.Json(resultadoFinal);
});

// Inicialização do host web e escuta na porta de rede configurada
app.Run("http://localhost:5000");