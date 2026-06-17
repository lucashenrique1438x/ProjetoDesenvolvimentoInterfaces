const map = L.map('map').setView([-14.235, -51.925], 4); 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const markersGroup = L.layerGroup().addTo(map);

async function Localizar() {
    const municipioInput = document.getElementById('municipio').value.trim();
    const ufInput = document.getElementById('ufs').value;

    if (!municipioInput || !ufInput) {
        alert("Por favor, digite o município e selecione a UF.");
        return;
    }

    try {
        markersGroup.clearLayers();

        const urlMunicipio = `https://apidadosabertos.saude.gov.br/macrorregiao-e-regiao-de-saude/municipio?municipio=${encodeURIComponent(municipioInput)}&sigla_uf=${ufInput}&limit=1&offset=0`;
        const resMunicipio = await fetch(urlMunicipio);
        const dataMunicipio = await resMunicipio.json();

        const listaMunicipios = dataMunicipio.macrorregiao_regiao_saude_municipios;
        if (!listaMunicipios || listaMunicipios.length === 0) {
            alert("Município não encontrado. Verifique a grafia e a UF.");
            return;
        }

        const codigoMunicipio = listaMunicipios[0].codigo_municipio;

        const urlEstabelecimentos = `https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?codigo_municipio=${codigoMunicipio}&limit=100&offset=0`;
        const resEstabelecimentos = await fetch(urlEstabelecimentos);
        const dataEstabelecimentos = await resEstabelecimentos.json();

        const estabelecimentos = dataEstabelecimentos.estabelecimentos;
        if (!estabelecimentos || estabelecimentos.length === 0) {
            alert("Nenhum estabelecimento de saúde encontrado para este município.");
            return;
        }

        plotarNoMapa(estabelecimentos);

    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Ocorreu um erro ao buscar os dados da API do DataSUS.");
    }
}

function plotarNoMapa(estabelecimentos) {
    let primeiro = true;

    estabelecimentos.forEach(local => {
        const lat = parseFloat(local.latitude_estabelecimento_decimo_grau);
        const lon = parseFloat(local.longitude_estabelecimento_decimo_grau);
        const nome = local.nome_fantasia || "Estabelecimento Sem Nome";

        if (!isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0) {
            const marker = L.marker([lat, lon]);
            
            marker.bindPopup(`
                <b>${nome}</b><br>
                <small>CNES: ${local.codigo_cnes || 'Não informado'}</small>
            `);
            
            markersGroup.addLayer(marker);

            if (primeiro) {
                map.setView([lat, lon], 13); 
                primeiro = false;
            }
        }
    });

    if (primeiro) {
        alert("Os estabelecimentos foram encontrados, mas nenhum continha coordenadas geográficas válidas cadastradas.");
    }
}