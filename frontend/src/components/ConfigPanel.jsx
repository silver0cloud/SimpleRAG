// ─────────────────────────────────────────────────────────────────────────
// ConfigPanel.jsx — the sidebar: where a user supplies their own API keys
// and picks a topic to build a retrieval corpus around.
//
// Why keys are typed in the browser at all: this is a "bring your own key"
// learning app, so each visitor uses their own free-tier NewsAPI/Gemini
// quota instead of sharing yours. In a real product you'd instead store
// keys server-side (see backend/.env.example) and never expose them to
// the client.
// ─────────────────────────────────────────────────────────────────────────
export default function ConfigPanel({
  newsApiKey,
  setNewsApiKey,
  geminiApiKey,
  setGeminiApiKey,
  topic,
  setTopic,
  onFetch,
  fetchLoading,
}) {
  return (
    <aside className="config-panel">
      <div className="brand">
        <span className="brand-dot" aria-hidden="true" />
        <span className="brand-name">NEWS·RAG</span>
      </div>
      <p className="brand-tagline">
        A minimal Retrieve → Augment → Generate pipeline over live news.
      </p>

      <div className="field">
        <label htmlFor="news-key">
          NewsAPI key
          <a href="https://newsapi.org/register" target="_blank" rel="noreferrer">
            get one free ↗
          </a>
        </label>
        <input
          id="news-key"
          type="password"
          placeholder="paste your NewsAPI key"
          value={newsApiKey}
          onChange={(e) => setNewsApiKey(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="gemini-key">
          Gemini API key
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
            get one free ↗
          </a>
        </label>
        <input
          id="gemini-key"
          type="password"
          placeholder="paste your Gemini key"
          value={geminiApiKey}
          onChange={(e) => setGeminiApiKey(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="topic">Topic to research</label>
        <input
          id="topic"
          type="text"
          placeholder="e.g. artificial intelligence"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onFetch()}
        />
      </div>

      <button className="btn-primary" onClick={onFetch} disabled={fetchLoading}>
        {fetchLoading ? "Fetching…" : "Fetch news corpus"}
      </button>

      <p className="hint">
        Keys stay in your browser's local storage only — they're sent
        straight to NewsAPI/Gemini via our backend, never logged anywhere.
      </p>
    </aside>
  );
}
