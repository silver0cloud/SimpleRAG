// ─────────────────────────────────────────────────────────────────────────
// main.jsx — the entry point.
//
// This is the very first JS that runs in the browser (index.html loads it
// with <script type="module" src="/src/main.jsx">). All it does is mount
// our <App /> component into the <div id="root"> that lives in index.html.
// Everything else — API calls, RAG state, UI — is built up from App.jsx.
// ─────────────────────────────────────────────────────────────────────────
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
