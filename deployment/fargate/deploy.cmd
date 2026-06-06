@echo off
setlocal

:: ============================================================
:: deploy.cmd
:: Triggers a new ECS Fargate deployment.
:: Run after the image has been built and pushed to ECR from WSL.
::
:: Prerequisites:
::   - Image has been pushed to ECR (see README - Deploying)
::   - infra-setup.cmd has been run at least once
::   - AWS CLI installed and configured
::
:: Usage:
::   deploy.cmd <REGION>
:: Example:
::   deploy.cmd eu-central-1
:: ============================================================

set REGION=%1

if "%REGION%"=="" (
    echo ERROR: REGION is required.
    echo Usage: deploy.cmd ^<REGION^>
    exit /b 1
)

echo Resolving AWS account ID from current session...
for /f "delims=" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
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
aws ecs update-service --cluster %CLUSTER% --service %SERVICE% --force-new-deployment --region %REGION% >nul
if %errorlevel% neq 0 (echo ERROR: ECS update failed. & exit /b 1)

echo.
echo === Deploy triggered ===
echo ECS is pulling the new image and replacing tasks (~1-2 minutes).
echo.
for /f "delims=" %%i in ('aws elbv2 describe-load-balancers --names %APP%-alb --query "LoadBalancers[0].DNSName" --output text --region %REGION% 2^>nul') do set ALB_DNS=%%i
if not "%ALB_DNS%"=="" echo App URL: http://%ALB_DNS%
echo.
echo To watch rollout:
echo   aws ecs wait services-stable --cluster %CLUSTER% --services %SERVICE% --region %REGION%
