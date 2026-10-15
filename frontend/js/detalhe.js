import {
  TYPE_LABELS,
  TYPE_BADGE_CLASS,
  contactHref,
  escapeHtml,
  fetchOpportunityById,
  formatDate,
} from "./api.js";

const root = document.getElementById("detail-root");
const id = new URLSearchParams(location.search).get("id");

if (!id) {
  root.innerHTML =
    '<div class="container page-main"><p class="status-msg status-msg--error">Oportunidade não indicada.</p></div>';
} else {
  fetchOpportunityById(id)
    .then((item) => {
      const typeLabel = TYPE_LABELS[item.type] || item.type;
      const badgeClass = TYPE_BADGE_CLASS[item.type] || "";
      const img =
        item.imageUrl ||
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80";

      document.title = `${item.title} — Perto de Mim`;

      root.innerHTML = `
        <section class="detail-hero">
          <div class="container">
            <a href="index.html#explorar" class="link-arrow" style="display:inline-block;margin-bottom:1rem">← Voltar</a>
            <img src="${escapeHtml(img)}" alt="">
            <span class="opp-card__badge ${badgeClass}">${escapeHtml(typeLabel)}</span>
            <h1 style="margin:0.75rem 0 0.5rem;font-size:1.75rem">${escapeHtml(item.title)}</h1>
            <div class="detail-meta">
              <span>${escapeHtml(item.organization)}</span>
              <span>${escapeHtml(item.location)}</span>
              <span>Publicado ${formatDate(item.publishedAt)}</span>
              ${item.expiresAt ? `<span>Validade ${formatDate(item.expiresAt)}</span>` : ""}
            </div>
            <p class="prose">${escapeHtml(item.description)}</p>
            <p style="margin-top:1.5rem">
              <a class="btn btn--primary" href="${contactHref(item.contact)}">Candidatar / Contactar</a>
              ${item.lat != null ? `<a class="btn btn--navy" style="margin-left:0.5rem" href="mapa.html">Ver no mapa</a>` : ""}
            </p>
          </div>
        </section>
      `;
    })
    .catch(() => {
      root.innerHTML =
        '<div class="container page-main"><p class="status-msg status-msg--error">Oportunidade não encontrada ou API indisponível.</p></div>';
    });
}
