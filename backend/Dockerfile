# ── backend/Dockerfile ──────────────────────────────────────────────────
# A small, production-lean image for the FastAPI backend.
# python:3.12-slim keeps the image small; we only copy what's needed so
# Docker's layer cache stays useful (requirements.txt rarely changes,
# main.py changes often — installing deps first means code edits don't
# force a full pip reinstall on every rebuild).

FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached layer — only reinstalls if
# requirements.txt actually changes).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Now copy the application code.
COPY main.py .

EXPOSE 8000

# No --reload in production images — that's a dev-only convenience.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
