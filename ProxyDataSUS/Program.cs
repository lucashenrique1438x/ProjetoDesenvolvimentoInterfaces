using System.Net.Http;

var builder = WebApplication.CreateBuilder(args);

// 1. Configura a política de CORS para permitir que o seu frontend acesse o servidor C#
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddHttpClient();

var app = builder.Build();

app.UseCors();

// Endpoint Proxy 1: Buscar Código do Município
app.MapGet("/api/municipio", async (string municipio, string uf, IHttpClientFactory clientFactory) =>
{
    var client = clientFactory.CreateClient();
    var url = $"https://apidadosabertos.saude.gov.br/macrorregiao-e-regiao-de-saude/municipio?municipio={Uri.EscapeDataString(municipio)}&sigla_uf={uf}&limit=1&offset=0";
    
    var response = await client.GetAsync(url);
    var content = await response.Content.ReadAsStringAsync();
    
    return Results.Content(content, "application/json");
});

// Endpoint Proxy 2: Buscar Estabelecimentos
app.MapGet("/api/estabelecimentos", async (string codigo_municipio, IHttpClientFactory clientFactory) =>
{
    var client = clientFactory.CreateClient();
    var url = $"https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_municipio={codigo_municipio}&limit=100&offset=0";
    
    var response = await client.GetAsync(url);
    var content = await response.Content.ReadAsStringAsync();
    
    return Results.Content(content, "application/json");
});

app.Run("http://localhost:5000");