@echo off
setlocal

set ROOT=%~dp0
set ROOT=%ROOT:~0,-1%

if exist "%ROOT%\dev.local.cmd" (
  echo Loading local development environment from dev.local.cmd...
  call "%ROOT%\dev.local.cmd"
)

:: Cognito configuration is required for both the Vite client and FastAPI backend.
set VITE_AUTH_MODE=cognito
set VITE_COGNITO_USER_POOL_ID=eu-central-1_cM7UmwtpB
set VITE_COGNITO_CLIENT_ID=2kb538fbaa8udmh32ov0q7bm9
set VITE_COGNITO_DOMAIN=resin-calculator-325866321073.auth.eu-central-1.amazoncognito.com
set VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
set AUTH_MODE=cognito
set COGNITO_USER_POOL_ID=%VITE_COGNITO_USER_POOL_ID%
set COGNITO_CLIENT_ID=%VITE_COGNITO_CLIENT_ID%
set COGNITO_REGION=eu-central-1

:: DynamoDB is mandatory for entitlements in every environment.
where aws >nul 2>nul
if errorlevel 1 (
  echo ERROR: AWS CLI is required because entitlements are stored only in DynamoDB.
  exit /b 1
)

if "%HFZWOOD_AWS_PROFILE%"=="" set HFZWOOD_AWS_PROFILE=hfzwood
set HFZWOOD_AWS_PROFILE_ARG=--profile %HFZWOOD_AWS_PROFILE%

for /f "delims=" %%r in ('aws cloudformation describe-stacks --stack-name AppStack --region eu-central-1 %HFZWOOD_AWS_PROFILE_ARG% --query "Stacks[0].Outputs[?OutputKey=='TaskRoleArn'].OutputValue" --output text 2^>nul') do set HFZWOOD_TASK_ROLE_ARN=%%r
if "%HFZWOOD_TASK_ROLE_ARN%"=="" (
  echo ERROR: Could not resolve the ECS task role ARN for DynamoDB entitlements.
  exit /b 1
)

for /f "tokens=1,2,3" %%a in ('aws sts assume-role --role-arn "%HFZWOOD_TASK_ROLE_ARN%" --role-session-name local-dev --duration-seconds 3600 %HFZWOOD_AWS_PROFILE_ARG% --query "[Credentials.AccessKeyId,Credentials.SecretAccessKey,Credentials.SessionToken]" --output text 2^>nul') do (
  set AWS_ACCESS_KEY_ID=%%a
  set AWS_SECRET_ACCESS_KEY=%%b
  set AWS_SESSION_TOKEN=%%c
)
if "%AWS_ACCESS_KEY_ID%"=="" (
  echo ERROR: Could not assume the ECS task role for DynamoDB entitlements.
  exit /b 1
)
set AWS_DEFAULT_REGION=eu-central-1
set ENTITLEMENTS_TABLE_NAME=hfzwood-entitlements

echo Starting HFZWood with Cognito and DynamoDB entitlements...
call npm install --prefix "%ROOT%\frontend"
call npm --prefix "%ROOT%\frontend" run build
if errorlevel 1 exit /b 1

start "Backend" cmd /k "cd /d "%ROOT%" && uv run --project backend uvicorn public.app:app --app-dir backend --host 0.0.0.0 --port 5000 --reload"
start "Frontend" cmd /k "cd /d "%ROOT%" && npm --prefix frontend run dev"
echo Done. Backend: http://localhost:5000 ^| Frontend: http://localhost:5173
