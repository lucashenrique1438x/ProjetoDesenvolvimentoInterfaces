const AppState = {
    map: null,
    markers: [],
    loading: false,
    currentLocation: null
};

window.addEventListener("load", () => {
    initMap();
});

function initMap(lat = -14.2350, lng = -51.9253, zoom = 5) {
    if (AppState.map) {
        AppState.map.remove();
    }

    AppState.map = L.map("map").setView([lat, lng], zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(AppState.map);
}

async function Localizar() {
    const municipio = getInputValue("municipio");
    const uf = getInputValue("ufs");

    if (!validateSearch(municipio, uf)) return;

    setLoading(true);

    try {
        const location = await getMunicipioCoords(municipio, uf);

        if (!location) {
            showMessage("Local não encontrado");
            return;
        }

        AppState.currentLocation = location;

        initMap(location.lat, location.lon, 12);

        const establishments = await getEstablishments(location);

        renderEstablishments(establishments);

    } catch (error) {
        console.error(error);
        showMessage("Erro ao buscar dados. Tente novamente.");
    } finally {
        setLoading(false);
    }
}

async function getMunicipioCoords(municipio, uf) {
    const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(municipio)}&state=${encodeURIComponent(uf)}&country=Brazil&format=json`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data || data.length === 0) return null;

    return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        name: municipio,
        uf
    };
}

async function getEstablishments(location) {
    return [
        createEstablishment("Hospital Municipal", "Hospital", location.lat + 0.01, location.lon + 0.01),
        createEstablishment("UBS Central", "UBS", location.lat - 0.01, location.lon - 0.01),
        createEstablishment("Farmácia Popular", "Farmácia", location.lat + 0.02, location.lon - 0.01)
    ];
}

function createEstablishment(name, type, lat, lon) {
    return { name, type, lat, lon };
}

function renderEstablishments(list) {
    clearMarkers();

    list.forEach(item => {
        const marker = L.marker([item.lat, item.lon])
            .addTo(AppState.map)
            .bindPopup(`<strong>${item.name}</strong><br/>Tipo: ${item.type}`);

        AppState.markers.push(marker);
    });
}

function clearMarkers() {
    AppState.markers.forEach(marker => AppState.map.removeLayer(marker));
    AppState.markers = [];
}

function getInputValue(id) {
    return document.getElementById(id).value.trim();
}

function validateSearch(municipio, uf) {
    if (!municipio || !uf) {
        showMessage("Preencha município e UF");
        return false;
    }
    return true;
}

function showMessage(msg) {
    alert(msg);
}

function setLoading(state) {
    AppState.loading = state;

    const btn = document.querySelector("button");

    if (btn) {
        btn.disabled = state;
        btn.innerText = state ? "Buscando..." : "Pesquisar";
    }
}