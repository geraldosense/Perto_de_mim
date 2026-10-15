export const CATEGORIES = [
  { id: "emprego", label: "Emprego", short: "Emprego" },
  { id: "estagio", label: "Estágios", short: "Estágio" },
  { id: "formacao", label: "Formação", short: "Formação" },
  { id: "projetos", label: "Projetos", short: "Projeto" },
  { id: "apoio", label: "Serviços de Apoio", short: "Apoio" },
];

export const TYPE_LABELS = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.short])
);

export const TYPE_BADGE_CLASS = {
  emprego: "badge--emprego",
  estagio: "badge--estagio",
  formacao: "badge--formacao",
  projetos: "badge--projetos",
  apoio: "badge--apoio",
};

export function getApiBase() {
  const meta = document.querySelector('meta[name="api-base"]');
  if (meta?.content?.trim()) {
    return meta.content.trim().replace(/\/$/, "");
  }
  if (location.port === "3001") {
    return "";
  }
  return "http://127.0.0.1:3001";
}

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBase()}${p}`;
}

export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

export function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function contactHref(contact) {
  if (!contact) return "#";
  if (contact.includes("@")) {
    return `mailto:${encodeURIComponent(contact)}`;
  }
  return contact.startsWith("http") ? contact : "#";
}

export async function fetchOpportunities(params = {}) {
  const query = new URLSearchParams();
  if (params.type) query.set("type", params.type);
  if (params.location) query.set("location", params.location);
  if (params.q) query.set("q", params.q);
  if (params.featured) query.set("featured", "true");

  const url = apiUrl(
    `/api/opportunities${query.toString() ? `?${query}` : ""}`
  );
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export async function fetchLocations() {
  const res = await fetch(apiUrl("/api/locations"));
  if (!res.ok) return ["Fundão"];
  return res.json();
}

export async function fetchOpportunityById(id) {
  const res = await fetch(apiUrl(`/api/opportunities/${id}`));
  if (!res.ok) throw new Error("Not found");
  return res.json();
}

export function createOpportunityCard(item, { compact = false } = {}) {
  const typeLabel = TYPE_LABELS[item.type] || item.type;
  const badgeClass = TYPE_BADGE_CLASS[item.type] || "";
  const img =
    item.imageUrl ||
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80";
  const dateLabel = item.expiresAt
    ? `Até ${formatDate(item.expiresAt)}`
    : `Publicado ${formatDate(item.publishedAt)}`;

  const article = document.createElement("article");
  article.className = compact ? "opp-card opp-card--compact" : "opp-card";
  article.innerHTML = `
    <a class="opp-card__link" href="detalhe.html?id=${encodeURIComponent(item.id)}" aria-label="Ver ${escapeHtml(item.title)}">
      <div class="opp-card__media">
        <img src="${escapeHtml(img)}" alt="" loading="lazy">
        <span class="opp-card__badge ${badgeClass}">${escapeHtml(typeLabel)}</span>
      </div>
      <div class="opp-card__body">
        <h3>${escapeHtml(item.title)}</h3>
        <ul class="opp-card__meta">
          <li><span class="icon" aria-hidden="true">${iconBuilding()}</span>${escapeHtml(item.organization)}</li>
          <li><span class="icon" aria-hidden="true">${iconPin()}</span>${escapeHtml(item.location)}</li>
          <li><span class="icon" aria-hidden="true">${iconCalendar()}</span>${dateLabel}</li>
        </ul>
        <span class="opp-card__arrow" aria-hidden="true">${iconArrow()}</span>
      </div>
    </a>
  `;
  return article;
}

function iconBuilding() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4"/></svg>`;
}

function iconPin() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`;
}

function iconCalendar() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>`;
}

function iconArrow() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
}

export function showApiError(container) {
  if (!container) return;
  container.textContent =
    "Não foi possível ligar à API. Executa a tarefa «Perto de Mim: API (backend)» ou npm run dev na raiz.";
  container.className = "status-msg status-msg--error";
  container.hidden = false;
}
