@echo off
setlocal

:: Resolve project root to the folder containing this script
set ROOT=%~dp0
set ROOT=%ROOT:~0,-1%

echo Starting Resin Calculator...

echo Installing frontend dependencies...
call npm install --prefix "%ROOT%\frontend"

echo Building frontend...
call npm --prefix "%ROOT%\frontend" run build

echo Starting backend...
start "Backend" cmd /k "cd /d "%ROOT%" && uv run --project backend uvicorn app:app --app-dir backend --host 0.0.0.0 --port 5000 --reload"

echo Starting frontend dev server...
start "Frontend" cmd /k "cd /d "%ROOT%" && npm --prefix frontend run dev"

echo Done. Backend: http://127.0.0.1:5000 ^| Frontend: http://127.0.0.1:5173
