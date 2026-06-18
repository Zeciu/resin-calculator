@echo off
setlocal

:: ============================================================
:: deploy.cmd
:: Triggers a new ECS Fargate deployment.
:: Run after the image has been built and pushed to ECR.
::
:: Prerequisites:
::   - Image has been pushed to ECR (see README - Deploying)
::   - CDK stack has been deployed at least once
::   - AWS CLI installed and configured
::
:: Usage:
::   deploy.cmd <REGION> [PROFILE]
:: Example:
::   deploy.cmd eu-central-1 hfzwood
:: ============================================================

set REGION=%1
set PROFILE=%2

if "%REGION%"=="" (
    echo ERROR: REGION is required.
    echo Usage: deploy.cmd ^<REGION^> [PROFILE]
    exit /b 1
)

set AWS=aws
if not "%PROFILE%"=="" set AWS=aws --profile %PROFILE%

echo Resolving AWS account ID from current session...
for /f "delims=" %%i in ('%AWS% sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
if "%ACCOUNT_ID%"=="" (
    echo ERROR: Could not resolve account ID. Check your AWS credentials.
    exit /b 1
)

set APP=resin-calculator
set ECR_URI=%ACCOUNT_ID%.dkr.ecr.%REGION%.amazonaws.com/%APP%
set CLUSTER=%APP%-cluster
set SERVICE=%APP%-service

echo.
echo === Resin Calculator - ECS Fargate Deploy ===
echo Region:  %REGION%
echo ECR URI: %ECR_URI%
echo.

:: ── 1. Force new ECS deployment ────────────────────────────
echo [1/1] Triggering ECS service update...
%AWS% ecs update-service --cluster %CLUSTER% --service %SERVICE% --force-new-deployment --region %REGION% >nul
if %errorlevel% neq 0 (echo ERROR: ECS update failed. & exit /b 1)

echo.
echo === Deploy triggered - waiting for rollout... ===
echo (this blocks until ECS is fully stable)
echo.
%AWS% ecs wait services-stable --cluster %CLUSTER% --services %SERVICE% --region %REGION%

for /f "delims=" %%s in ('%AWS% ecs describe-services --cluster %CLUSTER% --services %SERVICE% --region %REGION% --query "services[0].deployments | length(@)" --output text') do set DEP_COUNT=%%s
echo === Stable - deployments active: %DEP_COUNT% - App URL: https://hfzwood.com ===
