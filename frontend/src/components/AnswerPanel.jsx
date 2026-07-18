// ————— AnswerPanel.jsx ———————————————————————————————————————————————————
// Renders the generated answer as it streams in. 
// Plus the sources it was grounded on.
//
// The signature UI idea here: the prompt in main.py instructs Gemini to
// cite articles as [1], [2]... We turn those bracketed numbers into little
// "wire tags" that visually match the numbered source list below — 
// so you can SEE that every claim traces back to a specific fetched article. 
// This is the whole point of RAG over plain generation: answers are auditable.
// ─────────────────────────────────────────────────────────────────────────
export default function AnswerPanel({ answer, sources, asking, error }) {
  if (!answer && !asking && !error) return null;

  return (
    <section className="panel">
      <header className="panel-header">
        <h2>3 · Answer</h2>
        {asking && <span className="live-dot" aria-label="streaming" />}
      </header>

      {error && <p className="error-text">{error}</p>}

      {answer && (
        <p className="answer-text">
          {renderWithCitations(answer)}
          {asking && <span className="cursor-blink">▌</span>}
        </p>
      )}

      {sources.length > 0 && (
        <ol className="source-list">
          {sources.map((s) => (
            <li key={s.index} id={`source-${s.index}`} className="source-item">
              <span className="source-index">[{s.index}]</span>
              <a href={s.url} target="_blank" rel="noreferrer" className="source-title">
                {s.title}
              </a>
              <span className={`source-era tone-${s.era === "recent" ? "teal" : "dim"}`}>
                {s.source} · {s.publishedAt}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// Splits "... as shown in [2] ..." into text + clickable citation tags that
// jump to the matching entry in the source list.
function renderWithCitations(text) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (!match) return <span key={i}>{part}</span>;
    const n = match[1];
    return (
      <a key={i} href={`#source-${n}`} className="citation-tag">
        {part}
      </a>
    );
  });
}
