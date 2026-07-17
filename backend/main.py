"""
──────────────────────────────────────────────────────────────────────────────────────────────────────────
main.py — the ENTIRE RAG backend in just one file.

This is deliberately NOT split into services/routers/repositories the way a production app would be. 
For our first RAG project, see and understand every stage of the pipeline on one screen, the stages are:

    FETCH     /fetch-news   → pull raw articles from NewsAPI             (build the corpus)
    INDEX     retrieve()    → TF-IDF vectorise the corpus + the question (retrieval math)
    RETRIEVE  retrieve()    → rank by cosine similarity, keep top-k      (retrieval)
    AUGMENT   /ask          → stitch top-k articles into the prompt      (augmentation)
    GENERATE  /ask          → stream Gemini's answer back over SSE       (generation)

No vector database, no embedding model, no LangChain — JUST Python's stdlib `math` and `re`! 
and that's on purpose: TF-IDF + cosine similarity is THE CLASSIC retrieval (the same core idea search engines used for decades).
Once this clicks, swapping it for a proper embedding model + vector DB (see the README's "Extending" section) is just
a better retriever, not a different concept! EVERY line of this code is interesting.
──────────────────────────────────────────────────────────────────────────────────────────────────────────
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import httpx
import google.generativeai as genai
import math
import re
import json
import asyncio
from datetime import datetime, timedelta
"""
 PREFERRED METHOD - 
 Before running the backend terminal 1
 Fill in the Gemini API key and News API key in the ".env.example" file
 if you don't want to paste them into the UI everytime. 
 
"""
load_dotenv()

app = FastAPI(title="News RAG API")

# In dev, the Vite server (port 5173) calls this API directly, so it needs
# to be an allowed CORS origin. In Docker/production, nginx proxies /api/*
# to this service instead, so the browser never calls it cross-origin at
# all — but we keep this permissive for local development.

ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEWSAPI_BASE = "https://newsapi.org/v2/everything"

# Optional server-side keys (see backend/.env.example). If a learner running
# their OWN copy locally doesn't want to paste keys into the browser every
# time, they can set these once here instead. Requests can still override
# them per-call — handy if you want to demo with someone else's key.

ENV_NEWS_API_KEY = os.getenv("NEWS_API_KEY")
ENV_GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


# ── Models ──────────────────────────────────────────────────────────────────────

class FetchRequest(BaseModel):
    news_api_key: Optional[str] = None  # falls back to NEWS_API_KEY env var
    topic: str
    language: str = "en"
    page_size: int = 20


class AskRequest(BaseModel):
    question: str
    articles: list[dict]
    gemini_api_key: Optional[str] = None  # falls back to GEMINI_API_KEY env var

"""
─── TF-IDF helpers ───────────────────────────────────────────────────────────────

 TF-IDF ("Term Frequency – Inverse Document Frequency") turns each document
 into a vector of numbers, one per vocabulary word, so we can measure how
 "similar" two pieces of text are with simple geometry (cosine similarity)
 instead of an LLM call. It's cheap, fast, needs no external service, and
 is a genuinely good first retriever to learn on:

   1. tokenise()      — text  → list of lowercase, stopword-free words
   2. build_vocab()   — corpus → the ~400 most informative words to track
   3. tfidf_vector()  — text  → a vector of "how much does this word matter
                        here, relative to the article's own length"
   4. cosine_sim()    — two vectors → a 0..1 similarity score
   5. retrieve()      — question + articles → top-k most relevant articles

 This is a simplified TF-IDF (no true IDF weighting — see build_vocab's
 docstring), which keeps the math easy to read while still producing
 decent rankings for short news snippets.
 ────────────────────────────────────────────────────────────────────────────────
"""
STOPWORDS = {
    "the","a","an","and","or","but","in","on","at","to","for","of","with",
    "by","from","is","was","are","were","be","been","as","that","this","it",
    "its","into","about","which","have","has","had","will","would","could",
    "should","not","also","more","their","they","he","she","we","you","i",
    "my","your","our","his","her","all","can","may","do","did","does","if",
    "so","up","out","no","than","then","these","those","when","where","how",
    "what","who","after","before","during","while","since","until","over",
    "just","even","new","one","two","three","said","says","say"
}


def tokenise(text: str) -> list[str]:
    """
    Lowercase, strip punctuation, and drop short/stopword tokens.

    'The AI market grew fast!' → ['market', 'grew', 'fast']
    (word length > 2 filters noise like 'ai' — a real limitation worth
    knowing: this also throws away genuinely short but meaningful tokens.
    A production tokenizer would be smarter here.)
    
    """
    return [w for w in re.sub(r"[^a-z0-9\s]", " ", text.lower()).split()
            if len(w) > 2 and w not in STOPWORDS]


def build_vocab(texts: list[str], max_terms: int = 400) -> list[str]:
    """
    Pick the vocabulary — the fixed set of words every article/question
    gets vectorised against.

    We count document frequency (df): in how many articles does each word
    appear at least once? Words in almost every article (c >= 85% of n)
    are dropped — they're too common to distinguish anything ("news",
    "report"). Words appearing in only one article survive (c >= 1), since
    a rare, distinctive word is often exactly what makes retrieval work.
    This is the "IDF" (inverse document frequency) intuition, applied as a
    filter rather than a smooth weight — simpler to read, same effect.
    
    """
    
    df: dict[str, int] = {}
    for t in texts:
        for w in set(tokenise(t)):
            df[w] = df.get(w, 0) + 1
    n = len(texts)
    return [w for w, c in sorted(df.items(), key=lambda x: -x[1])
            if 1 <= c < n * 0.85][:max_terms]


def tfidf_vector(text: str, vocab: list[str]) -> list[float]:
    """
    Turns one piece of text into a fixed-length vector aligned to `vocab`.

    Each position holds that word's frequency within THIS text (term
    frequency), so two texts become directly comparable numeric vectors —
    the same shape regardless of how long the original text was.
    
    """
    words = tokenise(text)
    if not words:
        return [0.0] * len(vocab)
    freq: dict[str, int] = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1
    return [freq.get(term, 0) / len(words) for term in vocab]


def cosine_sim(a: list[float], b: list[float]) -> float:
    """
    Angle-based similarity between two vectors, 0 (unrelated) to 1
    (identical direction). This is the same metric real vector databases
    use on embeddings — we're just applying it to TF-IDF vectors instead
    of a neural embedding.
    
    """
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0


def retrieve(question: str, articles: list[dict], k: int = 6) -> list[dict]:
    """
    The 'R' in RAG: given a question and the full corpus, return the
    k most relevant articles.

    Note the vocabulary is rebuilt fresh from THIS corpus on every call —
    there's no persistent index. That's fine at a few dozen articles; at
    real scale you'd build the index once (offline) and query it many
    times, which is exactly what a vector database gives you.
    
    """
    texts = [a.get("_text", "") for a in articles]
    vocab = build_vocab(texts)
    q_vec = tfidf_vector(question, vocab)
    scored = []
    for a in articles:
        vec = tfidf_vector(a.get("_text", ""), vocab)
        scored.append({**a, "_score": cosine_sim(q_vec, vec)})
    scored.sort(key=lambda x: x["_score"], reverse=True)
    return scored[:k]


# ── Routes ───────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/fetch-news")
async def fetch_news(req: FetchRequest):
    """
    ────────────────────────────────────────────────────────────────────
    Stage 1 — build the retrieval corpus.

    Fires two NewsAPI requests in parallel: one for the last 14 days
    ("recent"), one for 15–28 days ago ("old"). Tagging each article with
    an `era` lets the frontend (and the LLM prompt in /ask) reason about
    *when* something was reported, not just what — handy for questions
    like "what's changed recently?".
    ────────────────────────────────────────────────────────────────────
    """
    
    news_api_key = req.news_api_key or ENV_NEWS_API_KEY
    if not news_api_key:
        raise HTTPException(
            400,
            detail="No NewsAPI key provided. Paste one in the UI, or set "
                   "NEWS_API_KEY in backend/.env.",
        )

    today       = datetime.utcnow().date()
    recent_from = (datetime.utcnow() - timedelta(days=14)).date()
    old_from = (datetime.utcnow() - timedelta(days=28)).date()
    old_to   = (datetime.utcnow() - timedelta(days=15)).date()

    params_base = {
        "q": req.topic,
        "language": req.language,
        "pageSize": req.page_size,
        "sortBy": "relevancy",
        "apiKey": news_api_key,
    }

    async with httpx.AsyncClient(timeout=20) as client:
        recent_resp, old_resp = await asyncio.gather(
            client.get(NEWSAPI_BASE, params={**params_base, "from": str(recent_from), "to": str(today)}),
            client.get(NEWSAPI_BASE, params={**params_base, "from": str(old_from),    "to": str(old_to)}),
        )

    recent_data = recent_resp.json()
    old_data    = old_resp.json()

    if recent_data.get("status") != "ok":
        raise HTTPException(400, detail=recent_data.get("message", "NewsAPI error (recent)"))
    if old_data.get("status") != "ok":
        raise HTTPException(400, detail=old_data.get("message", "NewsAPI error (older)"))

    def clean(raw_articles, era):
        out = []
        for a in raw_articles:
            if not a.get("title") or not a.get("description"):
                continue
            out.append({
                "title":       a["title"],
                "description": a.get("description", ""),
                "url":         a.get("url", ""),
                "source":      a.get("source", {}).get("name", "Unknown"),
                "publishedAt": a.get("publishedAt", "")[:10],
                "era":         era,
                "_text":       a["title"] + " " + a.get("description", ""),
            })
        return out

    articles = (
        clean(recent_data.get("articles", []), "recent") +
        clean(old_data.get("articles", []),    "old")
    )

    if not articles:
        raise HTTPException(404, detail="No articles found. Try a different topic.")

    return {"articles": articles, "count": len(articles)}


@app.post("/ask")
async def ask(req: AskRequest):
    """
    ─────────────────────────────────────────────────────────────────────────
    Stages 2–4 — retrieve, augment, and generate.

    1. RETRIEVE: rank the supplied articles against the question (TF-IDF).
    2. AUGMENT:  stitch the top-k articles into a numbered context block
                 and wrap it in an instruction prompt.
    3. GENERATE: stream Gemini's answer back to the client token-by-token
                 as Server-Sent Events, ending with a `sources` payload so
                 the frontend can render clickable [1] [2] citations.
    ──────────────────────────────────────────────────────────────────────────            
    """
    if not req.articles:
        raise HTTPException(400, detail="No articles provided. Fetch news first.")

    gemini_api_key = req.gemini_api_key or ENV_GEMINI_API_KEY
    if not gemini_api_key:
        raise HTTPException(
            400,
            detail="No Gemini key provided. Paste one in the UI, or set "
                   "GEMINI_API_KEY in backend/.env.",
        )

    # ── Retrieve ──
    top_docs = retrieve(req.question, req.articles, k=6)

    # ── Augment: build the numbered context block the LLM will cite from ──
    context_parts = []
    for i, a in enumerate(top_docs, 1):
        era_label = "Recent" if a.get("era") == "recent" else "Older"
        context_parts.append(
            f"[{i}] ({era_label} · {a.get('source','?')} · {a.get('publishedAt','')})\n"
            f"Title: {a['title']}\n"
            f"Summary: {a.get('description','')}"
        )
    context = "\n\n".join(context_parts)

    prompt = (
        "You are a precise news analyst. Answer the user's question using ONLY the provided articles. "
        "Cite articles with [1], [2], etc. Be concise and factual. "
        "Note temporal differences between recent and older articles where relevant.\n\n"
        f"Articles:\n{context}\n\n"
        f"Question: {req.question}\n\nAnswer:"
    )

    # ── Generate: configure Gemini with the resolved key and stream ──
    genai.configure(api_key=gemini_api_key)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash-lite",
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=1000,
            temperature=0.3,
        ),
    )

    sources_payload = [
        {
            "index": i + 1,
            "title": a["title"],
            "url": a.get("url", ""),
            "source": a.get("source", ""),
            "publishedAt": a.get("publishedAt", ""),
            "era": a.get("era", ""),
        }
        for i, a in enumerate(top_docs)
    ]

    def stream_response():
        try:
            response = model.generate_content(prompt, stream=True)
            for chunk in response:
                text = chunk.text if hasattr(chunk, "text") else ""
                if text:
                    yield f"data: {json.dumps({'text': text})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            yield f"data: {json.dumps({'done': True, 'sources': sources_payload})}\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")
