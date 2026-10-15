import { apiUrl } from "./api.js";

const form = document.getElementById("publish-form");
const msg = document.getElementById("form-msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.hidden = true;

  const data = new FormData(form);
  const body = Object.fromEntries(data.entries());
  if (!body.expiresAt) delete body.expiresAt;
  if (!body.imageUrl) delete body.imageUrl;

  try {
    const res = await fetch(apiUrl("/api/opportunities"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Erro ao publicar");
    }
    msg.textContent = "Oportunidade publicada com sucesso! A redirecionar…";
    msg.className = "form-msg form-msg--ok";
    msg.hidden = false;
    setTimeout(() => {
      location.href = `detalhe.html?id=${encodeURIComponent(json.id)}`;
    }, 1200);
  } catch (err) {
    msg.textContent =
      err.message ||
      "Não foi possível publicar. Confirma se a API está a correr (npm run dev).";
    msg.className = "form-msg form-msg--err";
    msg.hidden = false;
  }
});
