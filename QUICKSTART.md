# News RAG — Quickstart

Get the app running in **one command** (no Docker needed).

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

## Docker (production)

```bash
docker compose up --build
```

App runs on `http://localhost` (port 80). See `README.md` for details.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `python: command not found` | Try `python3` — update `start.sh` line 5 accordingly |
| Port 8000 already in use | Kill the process: `lsof -ti:8000 \| xargs kill` |
| Port 5173 already in use | Kill the process: `lsof -ti:5173 \| xargs kill` |
| NewsAPI 426 error | Your free plan only supports last 30 days — already handled |
| Gemini 429 quota error | Switch model to `gemini-2.0-flash-lite` in `backend/main.py` or wait 24h |
| npm peer dependency error | Run `npm install` inside `frontend/` after setting Vite to `^7.0.0` in `package.json` |
