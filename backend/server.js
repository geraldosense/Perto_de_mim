const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, "data", "opportunities.json");
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

const OPPORTUNITY_TYPES = [
  "emprego",
  "estagio",
  "formacao",
  "projetos",
  "apoio",
];

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      callback(null, false);
    },
  })
);
app.use(express.json());
app.use(express.static(FRONTEND_DIR));

function readOpportunities() {
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

function writeOpportunities(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

function filterOpportunities(list, { type, location, q, featured }) {
  let result = [...list];

  if (featured === "true" || featured === "1") {
    result = result.filter((o) => o.featured === true);
  }

  if (type && OPPORTUNITY_TYPES.includes(type)) {
    result = result.filter((o) => o.type === type);
  }

  if (location) {
    const loc = location.toLowerCase().trim();
    result = result.filter((o) => o.location.toLowerCase().includes(loc));
  }

  if (q) {
    const term = q.toLowerCase().trim();
    result = result.filter(
      (o) =>
        o.title.toLowerCase().includes(term) ||
        o.description.toLowerCase().includes(term) ||
        o.organization.toLowerCase().includes(term)
    );
  }

  return result.sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
  );
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", name: "Perto de Mim API" });
});

app.get("/api/types", (_req, res) => {
  res.json(OPPORTUNITY_TYPES);
});

app.get("/api/locations", (_req, res) => {
  try {
    const list = readOpportunities();
    const locations = [...new Set(list.map((o) => o.location))].sort(
      (a, b) => a.localeCompare(b, "pt")
    );
    res.json(locations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter localizações." });
  }
});

app.get("/api/opportunities", (req, res) => {
  try {
    const list = readOpportunities();
    const filtered = filterOpportunities(list, {
      type: req.query.type,
      location: req.query.location,
      q: req.query.q,
      featured: req.query.featured,
    });
    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Não foi possível carregar as oportunidades." });
  }
});

app.get("/api/opportunities/:id", (req, res) => {
  try {
    const list = readOpportunities();
    const item = list.find((o) => o.id === req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Oportunidade não encontrada." });
    }
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter a oportunidade." });
  }
});

app.post("/api/opportunities", (req, res) => {
  const {
    title,
    type,
    description,
    location,
    organization,
    contact,
    expiresAt,
    imageUrl,
    lat,
    lng,
  } = req.body || {};

  if (!title || !type || !description || !location || !organization || !contact) {
    return res.status(400).json({
      error:
        "Campos obrigatórios: title, type, description, location, organization, contact.",
    });
  }

  if (!OPPORTUNITY_TYPES.includes(type)) {
    return res.status(400).json({
      error: `Tipo inválido. Use: ${OPPORTUNITY_TYPES.join(", ")}.`,
    });
  }

  try {
    const list = readOpportunities();
    const id = String(
      Math.max(0, ...list.map((o) => Number(o.id) || 0)) + 1
    );
    const newItem = {
      id,
      title: String(title).trim(),
      type,
      description: String(description).trim(),
      location: String(location).trim(),
      organization: String(organization).trim(),
      publishedAt: new Date().toISOString().slice(0, 10),
      expiresAt: expiresAt ? String(expiresAt).trim() : null,
      contact: String(contact).trim(),
      imageUrl: imageUrl ? String(imageUrl).trim() : null,
      featured: false,
      lat: typeof lat === "number" ? lat : null,
      lng: typeof lng === "number" ? lng : null,
    };
    list.push(newItem);
    writeOpportunities(list);
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar a oportunidade." });
  }
});

app.listen(PORT, () => {
  console.log(`Perto de Mim — http://localhost:${PORT}`);
});
