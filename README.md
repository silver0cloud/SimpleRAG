# News RAG — build your first Retrieval-Augmented Generation app

A small, fully working RAG pipeline: it pulls real, live news articles, indexes them, retrieves the most relevant ones for whatever you ask, and streams back a grounded, cited answer. No vector database, no LangChain, no framework magic — every moving part is ~200 lines of Python and React you can actually read.

If you've heard the term "RAG" thrown around and want to build one with your own hands before reaching for heavier tools, this is the project.

```
"What's changed in AI regulation in the last two weeks?"
        │
        ▼
 ┌─────────────┐   ┌───────────────┐   ┌───────────────┐   ┌──────────────┐
 │  1. FETCH   │──▶|  2. RETRIEVE  │──▶│  3. AUGMENT  │──▶│  4. GENERATE│
 │  NewsAPI    │   │  TF-IDF +     │   │  Build a      │   │  Gemini      │
 │  → articles │   │  cosine sim.  │   │  cited prompt │   │  streams the │
 │             │   │  → top 6 docs │   │               │   │  answer      │
 └─────────────┘   └───────────────┘   └───────────────┘   └──────────────┘
```

---

## Table of contents

1. [What is RAG, actually?](#1-what-is-rag-actually)
2. [What you're about to build](#2-what-youre-about-to-build)
3. [Project structure & setup](#3-project-structure--setup)
4. [Running it — localhost and Docker](#4-running-it--localhost-and-docker)

---

## 1. What is RAG, actually?

**RAG = Retrieval-Augmented Generation.** In plain terms: *look things up, then answer.*

### So how is that different from just... asking an LLM?

A plain LLM answers purely from what it learned during training — frozen at some cutoff date, and only what happened to be in its training data. Ask a plain LLM *"what happened in AI news this week?"* and it will either say "I don't know, my knowledge has a cutoff" or — worse — confidently make something up (this is called **hallucination**).

RAG fixes this by giving the model an "open book" for the specific question you're asking, right before it answers:

| | Plain LLM generation | RAG |
|---|---|---|
| Knowledge source | Frozen training data only | Training data **+** documents you fetch live |
| Up-to-date? | No — stuck at a training cutoff | Yes — as fresh as your data source |
| Can cite sources? | No — it's guessing from memory | Yes — every claim can point to a document |
| Can you fix wrong answers? | Retrain the whole model (expensive) | Fix your data/retrieval (cheap) |
| Hallucination risk | Higher on niche/recent topics | Lower — answer is grounded in real text |

### Why should a beginner AI engineer care?

Because **RAG is the pattern behind almost every real-world LLM product you've used** — customer support bots that answer from a company's docs, "chat with your PDF" tools, coding assistants that search your codebase before answering. Fine-tuning a model is slow, expensive, and still doesn't solve "the answer changes every day." RAG is the cheap, fast, controllable alternative — and it's usually the *first* thing you reach for before anything fancier.

### The four stages, in plain English

1. **Retrieve** — given a question, find the handful of documents most likely to contain the answer. (In this project: rank live news articles by similarity to your question.)
2. **Augment** — glue those documents into the prompt you're about to send the LLM, usually with instructions like *"answer only using the following context."*
3. **Generate** — the LLM writes an answer, grounded in what you handed it, instead of guessing from memory.

There's technically no separate step for "index" but you'll see it in this codebase — it's the prep work that makes retrieval possible: turning raw text into a searchable numeric form ahead of time.

> **A beginner's mental model:** RAG is an open-book exam. Plain LLM generation is a closed-book exam. The model isn't smarter in RAG — it just gets to read the textbook page relevant to the question before writing its answer.

---

## 2. What you're about to build

This project answers questions about **live news** by combining two free APIs and one from-scratch retrieval algorithm:

- **[NewsAPI](https://newsapi.org)** — fetches real, current articles for any topic you type (`"artificial intelligence"`, `"climate policy"`, your favorite football club, anything). This is your **corpus** — the pool of documents RAG retrieves from.
- **A hand-written TF-IDF retriever** (`backend/main.py`) — no external vector database. You'll see, in plain Python, exactly how "which document is most relevant to this question?" gets turned into numbers and geometry (cosine similarity). This is the part most tutorials hide behind a library — here it's ~40 lines you can step through.
- **[Google Gemini](https://aistudio.google.com/app/apikey)** — takes the retrieved articles plus your question and streams back a concise, **cited** answer (`[1]`, `[2]`...) so you can verify every claim against a real source.

Put together: you type a topic like `"space exploration"`, the app fetches ~20–40 recent and slightly-older articles, and you can then ask things like *"what's changed in the last two weeks?"* or *"where do sources disagree?"* — and get an answer that's grounded in articles published today, not the model's frozen memory.

**Why this is a good first RAG project specifically:**
- Every stage is visible and inspectable — nothing is hidden inside a framework.
- The retriever (TF-IDF) is simple enough to fully understand in one sitting, but is the *same core idea* production systems use with fancier embeddings.
- You get instant, tangible proof that RAG works: ask about something from yesterday's news, and watch the model cite the actual article instead of saying "I don't have that information."
- It's a real full-stack app (FastAPI + React), so you also pick up the "wiring" — streaming responses, API key handling, CORS — that most RAG tutorials skip.

Once this clicks, the natural next step (outlined in [Extending the pipeline](#extending-the-pipeline) below) is swapping the TF-IDF retriever for real embeddings and a vector database — same architecture, better retrieval.

---

## 3. Project structure & setup

```
SimpleRAG/
├── backend/
│   ├── main.py              # FastAPI app — fetch, TF-IDF index, retrieve, stream (read this first!)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example         # copy → .env to store API keys server-side (optional)
│   └── .dockerignore
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx              # React entry point
│   │   ├── App.jsx               # orchestrates fetch → ask → stream (read this second!)
│   │   ├── App.css               # the "newsroom terminal" theme
│   │   ├── index.css             # design tokens (colors, fonts)
│   │   └── components/
│   │       ├── ConfigPanel.jsx     # API keys + topic input (sidebar)
│   │       ├── FetchPanel.jsx      # shows the retrieved article corpus
│   │       ├── QuestionPanel.jsx   # question input + example prompts
│   │       └── AnswerPanel.jsx     # streamed answer + clickable citations
│   ├── public/favicon.svg
│   ├── index.html
│   ├── vite.config.js       # dev server + /api proxy → backend:8000
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf           # production: serves the app + proxies /api
│   └── .dockerignore
│
├── docker-compose.yml       # `docker compose up --build` runs the whole thing
├── start.sh / start.bat     # one-command local dev launcher (mac/linux / windows)
├── QUICKSTART.md
└── README.md                 # you are here
```

**Suggested reading order** if you want to actually learn from the code rather than just run it: `backend/main.py` top to bottom (it's one file, heavily commented, and covers every RAG stage) → `frontend/src/App.jsx` (the state machine that drives fetch → ask → stream) → the four files in `frontend/src/components/`.

### Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Docker (optional) | any recent version | `docker --version` |

You'll also need two **free** API keys:

1. **NewsAPI key** → [newsapi.org/register](https://newsapi.org/register). Free tier: 100 requests/day, articles from the last month — plenty for learning.
2. **Gemini API key** → [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). Free tier available; sign in with a Google account and generate a key.

### Where API keys go

You have two options, and they can be mixed:

- **Paste them into the app's sidebar** each time you run it (they're kept in your browser's `localStorage` only — nothing is sent anywhere except NewsAPI/Gemini themselves, via your own backend). This is the zero-setup option.
- **Put them in `backend/.env`** so you never have to paste them:
  ```bash
  cd backend
  cp .env.example .env
  # then open .env and fill in:
  #   NEWS_API_KEY=your_key_here
  #   GEMINI_API_KEY=your_key_here
  ```
  A key typed into the sidebar always overrides the `.env` value for that request, so `.env` is really just a "don't make me retype this" convenience.

> **Never commit `.env` with real keys in it.** It's already covered by `.dockerignore`; if you push this repo to GitHub, also add `backend/.env` to a `.gitignore`.

---

## 4. Running it — localhost and Docker

### Option A — one command (recommended for first run)

```bash
# macOS / Linux
bash start.sh

# Windows
start.bat
```

This creates a Python virtual environment, installs both backend and frontend dependencies, starts both servers, and opens `http://localhost:5173` in your browser automatically. Press `Ctrl+C` to stop everything.

### Option B — manual, two terminals (best for learning/debugging)

**Terminal 1 — backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API now live at `http://localhost:8000` — interactive docs at `http://localhost:8000/docs` (FastAPI generates this automatically; it's a great way to test `/fetch-news` and `/ask` without the frontend at all).

**Terminal 2 — frontend:**
```bash
cd frontend
npm install
npm run dev
```
App now live at `http://localhost:5173`. Vite's dev server proxies any `/api/*` call to `http://localhost:8000/*` (see `vite.config.js`), so the two servers talk to each other automatically.

### Option C — Docker (closer to how you'd actually deploy this)

```bash
# one-time: create the env file docker-compose expects (blank is fine)
cp backend/.env.example backend/.env

# build and run both containers
docker compose up --build
```

Open **`http://localhost`** (port 80 — no `:5173`, no `:8000`). Here's what's actually happening:

- `backend` container: the same FastAPI app, run with `uvicorn`, exposed only on Docker's internal network (not directly reachable from your machine).
- `frontend` container: a **two-stage build** — first Node.js compiles the React app into static files, then a tiny `nginx` image serves those files and reverse-proxies `/api/*` to the `backend` container (`frontend/nginx.conf`), the same job Vite's dev proxy does locally.

Stop everything with `Ctrl+C`, or `docker compose down` to also remove the containers.

**Why two different proxy setups (Vite vs nginx) for the same job?** This is a genuinely useful pattern to internalize: your dev server and your production server are different pieces of software, but the frontend code (`fetch('/api/...')`) never needs to know or care which one is running underneath it. That's the whole point of routing everything through a same-origin `/api` prefix instead of hardcoding `http://localhost:8000` into the React code.

---

## How it works, stage by stage

### 1. Fetch & build the corpus — `POST /fetch-news`
Two NewsAPI requests run in parallel: **recent** (last 14 days) and **older** (15–28 days ago), both sorted by relevancy to your topic. Each article is tagged with its `era` and flattened into a `_text` field (title + description) — the raw material the retriever will search over.

### 2. Retrieve — inside `POST /ask`
On every question, the backend:
1. Builds a TF-IDF vocabulary from all fetched articles (the ~400 most distinctive words).
2. Turns the question and every article into a numeric vector against that vocabulary.
3. Ranks articles by cosine similarity to the question, keeps the top 6.

> **Scaling tip:** at a few dozen articles, rebuilding the index per-question is instant. At real scale (thousands+ documents), you'd build the index once — offline — and swap TF-IDF for sentence-transformer embeddings stored in a proper vector database (Chroma, Qdrant, Pinecone). The *shape* of the code barely changes; `retrieve()` just gets backed by a smarter index.

### 3. Augment & generate — the rest of `POST /ask`
The top 6 articles become a numbered context block injected into a prompt instructing Gemini to answer **only** from that context and cite `[1]`, `[2]`, etc. The response streams back as Server-Sent Events and renders token-by-token in the UI; the final event carries source metadata so the frontend can turn citation numbers into clickable links back to the original articles.

---

## API reference

### `POST /fetch-news`
```json
{
  "news_api_key": "...",   // optional if NEWS_API_KEY is set in backend/.env
  "topic": "artificial intelligence",
  "language": "en",
  "page_size": 20
}
```
→ `{ "articles": [...], "count": N }`

### `POST /ask`
```json
{
  "question": "What are the latest breakthroughs?",
  "articles": [...],
  "gemini_api_key": "..."   // optional if GEMINI_API_KEY is set in backend/.env
}
```
→ Server-Sent Events stream. Each frame: `data: {"text": "..."}`. Final frame: `data: {"done": true, "sources": [...]}`.

---

## Extending the pipeline

| Goal | Change |
|---|---|
| Better retrieval quality | Swap TF-IDF for sentence-transformer embeddings + Chroma/Qdrant |
| Persist articles between runs | Store fetched articles in SQLite/Postgres instead of passing them in-memory |
| Multi-topic corpora | Add a topic selector and per-topic article stores |
| Authentication | Add a FastAPI `Depends` with a JWT or API-key header |
| Swap the LLM | Replace the `genai` call in `main.py`'s `/ask` route with OpenAI/Anthropic/Claude — the retrieval logic doesn't need to change at all |

---

## License

See [`LICENSE`](./LICENSE).
