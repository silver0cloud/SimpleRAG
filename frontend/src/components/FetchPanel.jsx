// ────── FetchPanel.jsx ────────────────────────────────────────────────────
// Shows the raw material RAG will retrieve from.
//
// This is the "corpus" step made visible. Every chip here is one document in our tiny in-memory index. 
// We split them into "recent" (last 14 days) vs "older" (15–28 days ago) because 
// the backend fetches both windows on purpose — it's a nice, concrete way to see retrieval 
// pull DIFFERENT articles depending on whether your question is about "now" or "trend over time".
// ──────────────────────────────────────────────────────────────────────────
export default function FetchPanel({ articles, loading, error, topic }) {
  const recent = articles.filter((a) => a.era === "recent");
  const old = articles.filter((a) => a.era === "old");

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>1 · Corpus</h2>
        {articles.length > 0 && (
          <span className="panel-meta">
            {articles.length} articles on "{topic}"
          </span>
        )}
      </header>

      {error && <p className="error-text">{error}</p>}

      {loading && <p className="muted">Pulling articles from NewsAPI…</p>}

      {!loading && articles.length === 0 && !error && (
        <p className="muted">
          No corpus yet. Enter a topic in the sidebar and hit{" "}
          <strong>Fetch news corpus</strong> to pull real articles — this is
          what the retriever will search over.
        </p>
      )}

      {articles.length > 0 && (
        <div className="corpus-columns">
          <ArticleColumn label="Recent · last 14 days" tone="teal" items={recent} />
          <ArticleColumn label="Older · 15–28 days ago" tone="dim" items={old} />
        </div>
      )}
    </section>
  );
}

function ArticleColumn({ label, tone, items }) {
  if (items.length === 0) return null;
  return (
    <div className="corpus-column">
      <h3 className={`corpus-column-label tone-${tone}`}>{label}</h3>
      <ul className="chip-list">
        {items.map((a, i) => (
          <li key={i} className="chip" title={a.description}>
            <span className="chip-source">{a.source}</span>
            <span className="chip-title">{a.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
