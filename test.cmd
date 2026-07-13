@echo off
setlocal
set ROOT=%~dp0
set ROOT=%ROOT:~0,-1%
set FAILED=0

echo === Backend tests (pytest) ===
call uv run --project "%ROOT%\backend" pytest "%ROOT%\backend" -v
if errorlevel 1 set FAILED=1

echo.
echo === Frontend tests (vitest) ===
call npm test --prefix "%ROOT%\frontend"
if errorlevel 1 set FAILED=1

echo.
if "%FAILED%"=="1" (
    echo RESULT: Some tests FAILED.
    exit /b 1
) else (
    echo RESULT: All tests passed.
    exit /b 0
)
