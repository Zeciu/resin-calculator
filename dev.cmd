@echo off
setlocal

:: Resolve project root to the folder containing this script
set ROOT=%~dp0
set ROOT=%ROOT:~0,-1%

:: Cognito public configuration (from InfraStack outputs)
set VITE_COGNITO_USER_POOL_ID=eu-central-1_cM7UmwtpB
set VITE_COGNITO_CLIENT_ID=2kb538fbaa8udmh32ov0q7bm9
set VITE_COGNITO_DOMAIN=resin-calculator-325866321073.auth.eu-central-1.amazoncognito.com
set VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback

echo Starting Resin Calculator...

echo Installing frontend dependencies...
call npm install --prefix "%ROOT%\frontend"

echo Building frontend...
set VITE_AUTH_MODE=cognito
call npm --prefix "%ROOT%\frontend" run build
if errorlevel 1 exit /b 1
set VITE_AUTH_MODE=

echo Starting backend...
start "Backend" cmd /k "cd /d "%ROOT%" && uv run --project backend uvicorn app:app --app-dir backend --host 0.0.0.0 --port 5000 --reload"

echo Starting frontend dev server...
start "Frontend" cmd /k "cd /d "%ROOT%" && npm --prefix frontend run dev"

echo Done. Backend: http://localhost:5000 ^| Frontend: http://localhost:5173
