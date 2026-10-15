import {
  CATEGORIES,
  TYPE_LABELS,
  escapeHtml,
  fetchLocations,
  fetchOpportunities,
  showApiError,
} from "./api.js";

const statusEl = document.getElementById("map-status");
const form = document.getElementById("map-search-form");
const inputLocation = document.getElementById("map-location");
const inputQ = document.getElementById("map-q");
const inputType = document.getElementById("map-type");
const resultsList = document.getElementById("map-results");
const resultsCount = document.getElementById("map-results-count");
const resetBtn = document.getElementById("map-reset");
const locationSuggestions = document.getElementById("map-location-suggestions");

const PIN_COLORS = {
  emprego: "#e87520",
  estagio: "#3b82f6",
  formacao: "#22c55e",
  projetos: "#a855f7",
  apoio: "#14b8a6",
};

const DEFAULT_CENTER = [40.139, -7.501];
const DEFAULT_ZOOM = 11;

let map;
let markersLayer;
const markersById = new Map();
let activeMarkerId = null;

function pinIcon(type, active = false) {
  const color = PIN_COLORS[type] || "#1a2744";
  const size = active ? 18 : 14;
  const ring = active ? "0 0 0 3px rgba(240,160,48,.55)" : "0 2px 6px rgba(0,0,0,.3)";
  return L.divIcon({
    className: "leaflet-pin-custom",
    html: `<span style="background:${color};width:${size}px;height:${size}px;border-radius:50%;display:block;border:2px solid #fff;box-shadow:${ring}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = isError ? "status-msg status-msg--error" : "status-msg";
  statusEl.hidden = !message;
}

function popupHtml(item) {
  const label = TYPE_LABELS[item.type] || item.type;
  return `
    <div class="map-popup">
      <strong>${escapeHtml(item.title)}</strong><br>
      <span style="color:${PIN_COLORS[item.type]}">${escapeHtml(label)}</span><br>
      ${escapeHtml(item.organization)} · ${escapeHtml(item.location)}<br>
      <a href="detalhe.html?id=${encodeURIComponent(item.id)}">Ver detalhes</a>
    </div>
  `;
}

function initMap() {
  map = L.map("map", { scrollWheelZoom: true }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
    maxZoom: 18,
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
}

function clearMarkers() {
  markersLayer.clearLayers();
  markersById.clear();
  activeMarkerId = null;
}

function focusMarker(item, { openPopup = true, pan = true } = {}) {
  if (item.lat == null || item.lng == null) return;
  activeMarkerId = item.id;
  refreshMarkerStyles();

  const marker = markersById.get(item.id);
  if (!marker) return;

  if (pan) {
    map.setView([item.lat, item.lng], Math.max(map.getZoom(), 13), { animate: true });
  }
  if (openPopup) marker.openPopup();

  resultsList.querySelectorAll(".map-results__item").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.id === String(item.id));
  });
}

function refreshMarkerStyles() {
  for (const [id, marker] of markersById) {
    const type = marker.__type;
    marker.setIcon(pinIcon(type, id === activeMarkerId));
  }
}

function addMarkers(items) {
  clearMarkers();
  const withCoords = items.filter((o) => o.lat != null && o.lng != null);

  for (const item of withCoords) {
    const marker = L.marker([item.lat, item.lng], {
      icon: pinIcon(item.type),
    }).bindPopup(popupHtml(item));
    marker.__type = item.type;
    marker.on("click", () => focusMarker(item, { openPopup: false, pan: false }));
    marker.addTo(markersLayer);
    markersById.set(item.id, marker);
  }

  return withCoords;
}

function renderResults(items) {
  resultsList.replaceChildren();
  const withCoords = items.filter((o) => o.lat != null && o.lng != null);

  resultsCount.textContent =
    withCoords.length === 0
      ? "0"
      : `${withCoords.length} no mapa`;

  if (withCoords.length === 0) {
    const li = document.createElement("li");
    li.className = "map-results__empty";
    li.textContent = items.length
      ? "Há oportunidades, mas sem coordenadas no mapa."
      : "Nenhum resultado. Ajusta a pesquisa.";
    resultsList.appendChild(li);
    return;
  }

  for (const item of withCoords) {
    const li = document.createElement("li");
    li.className = "map-results__item";
    li.dataset.id = item.id;
    const label = TYPE_LABELS[item.type] || item.type;
    li.innerHTML = `
      <span class="map-results__type" style="--pin:${PIN_COLORS[item.type] || "#1a2744"}">${escapeHtml(label)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <span class="map-results__meta">${escapeHtml(item.location)} · ${escapeHtml(item.organization)}</span>
    `;
    li.addEventListener("click", () => focusMarker(item));
    resultsList.appendChild(li);
  }
}

function fitToMarkers(items) {
  const withCoords = items.filter((o) => o.lat != null && o.lng != null);
  if (withCoords.length === 0) return;
  if (withCoords.length === 1) {
    map.setView([withCoords[0].lat, withCoords[0].lng], 13);
    return;
  }
  const bounds = L.latLngBounds(withCoords.map((o) => [o.lat, o.lng]));
  map.fitBounds(bounds.pad(0.12));
}

async function geocodePlace(name) {
  const query = name.trim();
  if (!query) return null;
  const params = new URLSearchParams({
    q: `${query}, Portugal`,
    format: "json",
    limit: "1",
  });
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data[0]) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      label: data[0].display_name,
    };
  } catch {
    return null;
  }
}

async function runSearch({ flyToPlace = true } = {}) {
  const filters = {
    location: inputLocation.value.trim(),
    q: inputQ.value.trim(),
    type: inputType.value,
  };

  setStatus("A pesquisar…");

  try {
    const items = await fetchOpportunities(filters);
    addMarkers(items);
    renderResults(items);

    const onMap = items.filter((o) => o.lat != null && o.lng != null);

    if (onMap.length > 0) {
      setStatus("");
      statusEl.hidden = true;
      fitToMarkers(onMap);
      return;
    }

    if (filters.location && flyToPlace) {
      const place = await geocodePlace(filters.location);
      if (place) {
        map.setView([place.lat, place.lng], 12, { animate: true });
        setStatus(`Local «${filters.location}» no mapa. Sem oportunidades com estes filtros.`);
        return;
      }
    }

    setStatus(
      items.length
        ? "Oportunidades encontradas, mas sem posição no mapa."
        : "Nenhuma oportunidade com estes filtros."
    );
  } catch {
    showApiError(statusEl);
  }
}

function fillTypeSelect() {
  for (const cat of CATEGORIES) {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.label;
    inputType.appendChild(opt);
  }
}

async function fillLocationSuggestions() {
  const locations = await fetchLocations();
  for (const loc of locations) {
    const opt = document.createElement("option");
    opt.value = loc;
    locationSuggestions.appendChild(opt);
  }
}

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  if (params.get("location")) inputLocation.value = params.get("location");
  if (params.get("q")) inputQ.value = params.get("q");
  if (params.get("type")) inputType.value = params.get("type");
}

function syncUrl() {
  const params = new URLSearchParams();
  if (inputLocation.value.trim()) params.set("location", inputLocation.value.trim());
  if (inputQ.value.trim()) params.set("q", inputQ.value.trim());
  if (inputType.value) params.set("type", inputType.value);
  const qs = params.toString();
  history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}`);
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  syncUrl();
  runSearch();
});

resetBtn?.addEventListener("click", () => {
  inputLocation.value = "";
  inputQ.value = "";
  inputType.value = "";
  syncUrl();
  runSearch({ flyToPlace: false });
  map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
});

fillTypeSelect();
fillLocationSuggestions().catch(() => {});
initMap();
applyUrlParams();
runSearch();
