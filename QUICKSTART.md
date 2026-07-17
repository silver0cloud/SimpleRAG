# News RAG — Quickstart

Get the app running in **one command** — no Docker needed for this path.

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |

You'll also need:
- A **NewsAPI key** → [newsapi.org/register](https://newsapi.org/register) (free)
- A **Gemini API key** → [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) (free)

You can either paste these into the app's sidebar each run, or save them once in `backend/.env` (copy `backend/.env.example` → `backend/.env` and fill them in) so you never have to retype them.

---

## One-command start

### macOS / Linux
```bash
bash start.sh
```

### Windows
```bat
start.bat
```

The script will:
1. Create a Python virtual environment and install backend dependencies
2. Install frontend npm packages
3. Start the FastAPI backend on `http://localhost:8000`
4. Start the Vite frontend on `http://localhost:5173`
5. Automatically open `http://localhost:5173` in your browser

---

## Stopping the app

Press `Ctrl+C` in the terminal window. Both servers will shut down.

---

## Manual start (if scripts don't work)

```bash
# Terminal 1 — backend
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

---

## Docker (closer to production)

```bash
cp backend/.env.example backend/.env   # required — even if you leave it blank
docker compose up --build
```

App runs on `http://localhost` (port 80). See `README.md` → "Running it — localhost and Docker" for what each container does.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `python: command not found` | Try `python3` — update `start.sh` line 5 accordingly |
| Port 8000 already in use | Kill the process: `lsof -ti:8000 \| xargs kill` |
| Port 5173 already in use | Kill the process: `lsof -ti:5173 \| xargs kill` |
| NewsAPI 426 error | Your free plan only supports the last month of articles — already handled by the 14/28-day windows in `main.py` |
| Gemini 429 quota error | Switch the model name in `backend/main.py`'s `/ask` route, or wait 24h |
| "No NewsAPI/Gemini key provided" | Paste a key in the sidebar, or set it in `backend/.env` and restart the backend |
| `docker compose up` fails immediately citing `backend/.env` | Run `cp backend/.env.example backend/.env` first — the file must exist, even empty |
| npm peer dependency error | Delete `frontend/node_modules` and re-run `npm install` |
