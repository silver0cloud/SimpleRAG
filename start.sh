#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo ""
echo "╔══════════════════════════════════╗"
echo "║        News RAG  —  Start        ║"
echo "╚══════════════════════════════════╝"
echo ""

# ── Backend setup ──────────────────────────────────────────────
echo "▸ Setting up Python virtual environment..."
cd "$BACKEND"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "  ✓ Backend dependencies ready"

# ── Frontend setup ─────────────────────────────────────────────
echo "▸ Installing frontend dependencies..."
cd "$FRONTEND"

if [ ! -d "node_modules" ]; then
  npm install --silent
fi
echo "  ✓ Frontend dependencies ready"

# ── Start backend ──────────────────────────────────────────────
echo ""
echo "▸ Starting backend  →  http://localhost:8000"
cd "$BACKEND"
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# ── Start frontend ─────────────────────────────────────────────
echo "▸ Starting frontend →  http://localhost:5173"
cd "$FRONTEND"
npm run dev &
FRONTEND_PID=$!

# ── Wait for frontend to be ready, then open browser ──────────
echo ""
echo "⏳ Waiting for servers to start..."
sleep 4

# Open browser (works on macOS and most Linux desktops)
URL="http://localhost:5173"
if command -v open &>/dev/null; then
  open "$URL"
elif command -v xdg-open &>/dev/null; then
  xdg-open "$URL"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✓ News RAG is running!                          ║"
echo "║                                                  ║"
echo "║  Frontend  →  http://localhost:5173              ║"
echo "║  Backend   →  http://localhost:8000              ║"
echo "║                                                  ║"
echo "║  Press Ctrl+C to stop both servers               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Graceful shutdown on Ctrl+C ───────────────────────────────
cleanup() {
  echo ""
  echo "▸ Shutting down..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  echo "  ✓ Done. Goodbye!"
  exit 0
}
trap cleanup SIGINT SIGTERM

# Keep script alive
wait
