// ─────────────────────────────────────────────────────────────────────────
// App.jsx — orchestrates the whole RAG flow on the frontend.
//
// This file deliberately keeps ALL state in one place (instead of scattering
// it across components) so that as a beginner you can read top-to-bottom
// and see the entire lifecycle of a RAG interaction:
//
//   1. FETCH   — pull raw articles from NewsAPI via our backend  (→ Retrieval corpus)
//   2. ASK     — send a question + the article corpus to /ask   (→ Retrieve + Augment + Generate)
//   3. STREAM  — read the answer back token-by-token over SSE   (→ Generation, live)
//
// Nothing here is React-magic beyond useState/useEffect. If you're new to
// RAG, the important part isn't the React — it's noticing WHERE retrieval
// happens (step 2, on the backend, in main.py) vs where generation happens
// (also step 2, but the *response* streams back here in step 3).
// ─────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import ConfigPanel from "./components/ConfigPanel.jsx";
import FetchPanel from "./components/FetchPanel.jsx";
import QuestionPanel from "./components/QuestionPanel.jsx";
import AnswerPanel from "./components/AnswerPanel.jsx";
import "./App.css";

// All backend calls go through /api/*, which vite.config.js proxies to
// http://localhost:8000/* in dev. In Docker (see the docker-compose setup
// later in the README), nginx does the same proxying job in production.
const API_BASE = "/api";

export default function App() {
  // ── API keys (kept in localStorage so you don't retype them every reload —
  //    this is a learning project; for anything real, never store secrets
  //    like this in the browser). ──
  const [newsApiKey, setNewsApiKey] = useState(
    () => localStorage.getItem("newsrag_news_key") || ""
  );
  const [geminiApiKey, setGeminiApiKey] = useState(
    () => localStorage.getItem("newsrag_gemini_key") || ""
  );
  useEffect(() => localStorage.setItem("newsrag_news_key", newsApiKey), [newsApiKey]);
  useEffect(() => localStorage.setItem("newsrag_gemini_key", geminiApiKey), [geminiApiKey]);

  // ── Step 1: the retrieval corpus. This is our tiny, ephemeral "vector
  //    database" — except instead of a real DB, it's just an array of
  //    article objects sitting in memory. Good enough to *learn* RAG on. ──
  const [topic, setTopic] = useState("artificial intelligence");
  const [articles, setArticles] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const handleFetchNews = useCallback(async () => {
    if (!newsApiKey.trim()) {
      setFetchError("Add your NewsAPI key first (see the sidebar).");
      return;
    }
    setFetchLoading(true);
    setFetchError("");
    setArticles([]);
    try {
      const res = await fetch(`${API_BASE}/fetch-news`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          news_api_key: newsApiKey.trim(),
          topic: topic.trim() || "artificial intelligence",
          language: "en",
          page_size: 20,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch news.");
      setArticles(data.articles);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setFetchLoading(false);
    }
  }, [newsApiKey, topic]);

  // ── Steps 2 + 3: ask a question over the fetched corpus and stream the
  //    answer back. The backend does retrieval (TF-IDF + cosine similarity)
  //    and augmentation (building the prompt); Gemini does generation; we
  //    just render the stream as it arrives. ──
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");

  const handleAsk = useCallback(async () => {
    if (!question.trim()) return;
    if (!geminiApiKey.trim()) {
      setAskError("Add your Gemini API key first (see the sidebar).");
      return;
    }
    if (articles.length === 0) {
      setAskError("Fetch some news first — there's nothing to retrieve from yet.");
      return;
    }

    setAsking(true);
    setAskError("");
    setAnswer("");
    setSources([]);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          articles,
          gemini_api_key: geminiApiKey.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Request failed (${res.status})`);
      }

      // The backend streams Server-Sent Events. `fetch` + a manual
      // ReadableStream reader is what lets us do SSE over a POST request
      // (the browser's built-in EventSource only supports GET).
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line ("\n\n").
        const frames = buffer.split("\n\n");
        buffer = frames.pop(); // keep the last (possibly incomplete) frame

        for (const frame of frames) {
          if (!frame.startsWith("data: ")) continue;
          const payload = JSON.parse(frame.slice(6));
          if (payload.error) throw new Error(payload.error);
          if (payload.text) setAnswer((prev) => prev + payload.text);
          if (payload.done) setSources(payload.sources || []);
        }
      }
    } catch (err) {
      setAskError(err.message);
    } finally {
      setAsking(false);
    }
  }, [question, geminiApiKey, articles]);

  return (
    <div className="app-shell">
      <ConfigPanel
        newsApiKey={newsApiKey}
        setNewsApiKey={setNewsApiKey}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        topic={topic}
        setTopic={setTopic}
        onFetch={handleFetchNews}
        fetchLoading={fetchLoading}
      />

      <main className="app-main">
        <FetchPanel
          articles={articles}
          loading={fetchLoading}
          error={fetchError}
          topic={topic}
        />
        <QuestionPanel
          question={question}
          setQuestion={setQuestion}
          onAsk={handleAsk}
          asking={asking}
          disabled={articles.length === 0}
        />
        <AnswerPanel
          answer={answer}
          sources={sources}
          asking={asking}
          error={askError}
        />
      </main>
    </div>
  );
}
