@echo off
echo Starting Resin Calculator...

echo Building frontend...
npm install --prefix frontend
npm run build --prefix frontend

echo Starting backend...
start "Backend" cmd /k "uv run --project backend uvicorn app:app --app-dir backend --host 0.0.0.0 --port 5000 --reload"

echo Starting frontend dev server...
start "Frontend" cmd /k "npm run dev --prefix frontend"

echo Done. Backend: http://127.0.0.1:5000 | Frontend: http://127.0.0.1:5173
