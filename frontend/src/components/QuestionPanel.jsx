// ────── QuestionPanel.jsx ────────────────────────────────────────────────────────
// It is where the user asks a question over the corpus.
//
// Submitting here triggers the actual "R" and "A" of RAG on the backend:
// Retrieve the top-k most relevant articles (TF-IDF + cosine similarity)
// and Augment a prompt with them. Generation happens in AnswerPanel, which renders the streamed response.
// ─────────────────────────────────────────────────────────────────────────────────
const EXAMPLES = [
  "What's changed in the last two weeks?",
  "Summarize the overall breakthroughs in recent days.",
  "What are the key disagreements between opinions on this topic?",
];

export default function QuestionPanel({ question, setQuestion, onAsk, asking, disabled }) {
  return (
    <section className="panel">
      <header className="panel-header">
        <h2>2 · Ask</h2>
      </header>

      <div className="ask-row">
        <input
          type="text"
          className="question-input"
          placeholder={
            disabled ? "Fetch a corpus first…" : "Ask something about the articles above…"
          }
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !asking && onAsk()}
          disabled={disabled}
        />
        <button className="btn-primary" onClick={onAsk} disabled={disabled || asking}>
          {asking ? "Thinking…" : "Ask"}
        </button>
      </div>

      <div className="example-chips">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            className="example-chip"
            disabled={disabled}
            onClick={() => setQuestion(ex)}
          >
            {ex}
          </button>
        ))}
      </div>
    </section>
  );
}
