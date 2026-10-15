# Perto de Mim

Plataforma para centralizar oportunidades locais (emprego, formação, estágios, atividades e apoio).

## Estrutura

- `backend/` — API REST em Node.js + Express (dados em `data/opportunities.json`)
- `frontend/` — Interface estática (HTML, CSS, JavaScript)

## Requisitos

- [Node.js](https://nodejs.org/) 18 ou superior

## Como executar

### Modo A — Go Live (recomendado no Cursor / VS Code)

1. Abre a pasta **`pap_1`** como workspace (não só o `frontend`).
2. Instala a extensão **Live Server** (Go Live), se ainda não tiveres.
3. **Terminal → Run Task… → `Perto de Mim: API (backend)`** — deixa este terminal aberto (API na porta **3001**).
4. Abre `frontend/index.html`, clica com o botão direito → **Open with Live Server** (ou “Go Live” na barra inferior).
5. O browser abre em **http://127.0.0.1:5500** (ou porta semelhante) com a lista de oportunidades.

O frontend liga-se à API em `http://127.0.0.1:3001` (meta `api-base` no HTML). O proxy do Live Server em `.vscode/settings.json` também encaminha `/api` para a API.

**Importante:** Go Live só mostra o HTML/CSS/JS. Sem a tarefa do backend a correr, a página fica vazia ou com mensagem de erro.

### Modo B — Um só comando (sem Go Live)

```bash
npm install --prefix backend
npm run dev
```

Abre **http://localhost:3001** — frontend e API no mesmo servidor.

(Porta **3001** por defeito para não conflitar com a 3000. Para mudar: `PORT=4000 npm run dev`.)

## API (básico)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Estado da API |
| GET | `/api/types` | Tipos de oportunidade |
| GET | `/api/opportunities` | Lista (query: `type`, `location`, `q`) |
| GET | `/api/opportunities/:id` | Detalhe |
| POST | `/api/opportunities` | Criar (JSON no body) |

Exemplo de criação:

```bash
curl -X POST http://localhost:3001/api/opportunities \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Voluntariado na biblioteca",
    "type": "atividade",
    "description": "Apoio na organização de eventos culturais.",
    "location": "Braga",
    "organization": "Biblioteca Municipal",
    "contact": "biblioteca@cm-braga.pt"
  }'
```

## Funcionalidades (frontend)

| Página | Função |
|--------|--------|
| `index.html` | Hero, pesquisa, categorias, destaques, explorar |
| `mapa.html` | Mapa interativo (Leaflet + OpenStreetMap) |
| `publicar.html` | Publicar oportunidade (POST API) |
| `detalhe.html?id=` | Ficha da oportunidade |
| `entrar.html` / `registar.html` | Demo de conta (localStorage) |
| `sobre.html` | Informação institucional |

## Próximos passos sugeridos

- Autenticação real no backend
- Base de dados PostgreSQL
- Moderação admin
# Perto_de_mim
