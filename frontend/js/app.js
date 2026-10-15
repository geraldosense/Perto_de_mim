import {
  CATEGORIES,
  createOpportunityCard,
  fetchLocations,
  fetchOpportunities,
  showApiError,
} from "./api.js";

const heroForm = document.getElementById("hero-search-form");
const heroQ = document.getElementById("hero-q");
const heroLocation = document.getElementById("hero-location");
const featuredList = document.getElementById("featured-list");
const exploreList = document.getElementById("explore-list");
const exploreStatus = document.getElementById("explore-status");
const categoryTiles = document.getElementById("category-tiles");
const navSearchBtn = document.getElementById("nav-search-btn");

let currentFilters = { type: "", location: "", q: "" };

function applyFiltersFromUrl() {
  const params = new URLSearchParams(location.search);
  currentFilters = {
    q: params.get("q") || "",
    location: params.get("location") || "",
    type: params.get("type") || "",
  };
  if (heroQ) heroQ.value = currentFilters.q;
  if (heroLocation) heroLocation.value = currentFilters.location;
}

function syncUrl() {
  const params = new URLSearchParams();
  if (currentFilters.q) params.set("q", currentFilters.q);
  if (currentFilters.location) params.set("location", currentFilters.location);
  if (currentFilters.type) params.set("type", currentFilters.type);
  const qs = params.toString();
  const newUrl = `${location.pathname}${qs ? `?${qs}` : ""}${location.hash || ""}`;
  history.replaceState(null, "", newUrl);
}

function renderList(container, items) {
  container.replaceChildren();
  const frag = document.createDocumentFragment();
  for (const item of items) {
    frag.appendChild(createOpportunityCard(item));
  }
  container.appendChild(frag);
}

async function loadFeatured() {
  if (!featuredList) return;
  try {
    const items = await fetchOpportunities({ featured: true });
    const slice = items.slice(0, 4);
    if (slice.length === 0) {
      featuredList.innerHTML =
        '<p class="empty-hint">Ainda não há destaques. Consulta todas abaixo.</p>';
      return;
    }
    renderList(featuredList, slice);
  } catch {
    showApiError(featuredList);
  }
}

async function loadExplore() {
  if (!exploreList) return;
  exploreStatus.hidden = false;
  exploreStatus.textContent = "A carregar…";
  exploreStatus.className = "status-msg";
  exploreList.replaceChildren();

  try {
    const items = await fetchOpportunities(currentFilters);
    if (items.length === 0) {
      exploreStatus.textContent =
        "Nenhuma oportunidade encontrada. Tenta outros filtros.";
      return;
    }
    exploreStatus.hidden = true;
    renderList(exploreList, items);
  } catch {
    showApiError(exploreStatus);
  }
}

function scrollToExplore() {
  document.getElementById("explorar")?.scrollIntoView({ behavior: "smooth" });
}

function runSearch(extra = {}) {
  currentFilters = {
    ...currentFilters,
    q: heroQ?.value.trim() || "",
    location: heroLocation?.value.trim() || "",
    ...extra,
  };
  syncUrl();
  loadExplore();
  scrollToExplore();
}

function buildCategoryTiles() {
  if (!categoryTiles) return;
  for (const cat of CATEGORIES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-tile";
    btn.dataset.type = cat.id;
    btn.innerHTML = `
      <span class="category-tile__icon" aria-hidden="true">${categoryIcon(cat.id)}</span>
      <span class="category-tile__label">${cat.label}</span>
    `;
    btn.addEventListener("click", () => {
      currentFilters.type = cat.id;
      syncUrl();
      loadExplore();
      scrollToExplore();
    });
    categoryTiles.appendChild(btn);
  }
}

function categoryIcon(id) {
  const icons = {
    emprego:
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
    estagio:
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>',
    formacao:
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 1 9l11 6 9-4.91V17h2V9L12 3z"/><path d="M5 13.18v4L12 21l7-3.82v-4L12 17z"/></svg>',
    projetos:
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    apoio:
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  };
  return icons[id] || icons.emprego;
}

async function fillLocationSelect() {
  if (!heroLocation) return;
  const locations = await fetchLocations();
  const existing = new Set(
    [...heroLocation.options].map((o) => o.value).filter(Boolean)
  );
  for (const loc of locations) {
    if (existing.has(loc)) continue;
    const opt = document.createElement("option");
    opt.value = loc;
    opt.textContent = loc;
    heroLocation.appendChild(opt);
  }
  if (currentFilters.location) {
    heroLocation.value = currentFilters.location;
  }
}

heroForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  runSearch();
});

navSearchBtn?.addEventListener("click", () => {
  document.getElementById("inicio")?.scrollIntoView({ behavior: "smooth" });
  heroQ?.focus();
});

document.getElementById("ver-todas-link")?.addEventListener("click", (e) => {
  e.preventDefault();
  currentFilters.type = "";
  syncUrl();
  loadExplore();
  scrollToExplore();
});

applyFiltersFromUrl();
buildCategoryTiles();
fillLocationSelect().catch(() => {});
loadFeatured();
loadExplore();
