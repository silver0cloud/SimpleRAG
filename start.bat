@echo off
setlocal EnableDelayedExpansion

set ROOT=%~dp0
set BACKEND=%ROOT%backend
set FRONTEND=%ROOT%frontend

echo.
echo ╔══════════════════════════════════╗
echo ║        News RAG  —  Start        ║
echo ╚══════════════════════════════════╝
echo.

:: ── Backend setup ──────────────────────────────────────────────
echo ^> Setting up Python virtual environment...
cd /d "%BACKEND%"

if not exist ".venv" (
  python -m venv .venv
)

call .venv\Scripts\activate.bat
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo   [OK] Backend dependencies ready

:: ── Frontend setup ─────────────────────────────────────────────
echo ^> Installing frontend dependencies...
cd /d "%FRONTEND%"

if not exist "node_modules" (
  npm install --silent
)
echo   [OK] Frontend dependencies ready

:: ── Start backend in a new window ─────────────────────────────
echo.
echo ^> Starting backend  -^>  http://localhost:8000
cd /d "%BACKEND%"
start "News RAG — Backend" cmd /k "call .venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000"

:: ── Start frontend in a new window ────────────────────────────
echo ^> Starting frontend -^>  http://localhost:5173
cd /d "%FRONTEND%"
start "News RAG — Frontend" cmd /k "npm run dev"

:: ── Wait then open browser ─────────────────────────────────────
echo.
echo Waiting for servers to start...
timeout /t 5 /nobreak >nul

start "" "http://localhost:5173"

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║  [OK] News RAG is running!                       ║
echo ║                                                  ║
echo ║  Frontend  -^>  http://localhost:5173            ║
echo ║  Backend   -^>  http://localhost:8000            ║
echo ║                                                  ║
echo ║  Close the Backend + Frontend windows to stop    ║
echo ╚══════════════════════════════════════════════════╝
echo.

endlocal
