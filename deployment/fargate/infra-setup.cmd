@echo off
setlocal enabledelayedexpansion

:: ============================================================
:: infra-setup.cmd
:: Creates all AWS infrastructure needed to run resin-calculator
:: on ECS Fargate behind an Application Load Balancer.
::
:: Run once before the first deploy. Safe to re-run — each step
:: checks if the resource exists before attempting to create it.
::
:: Creates:
::   - ECR repository        (Docker image registry)
::   - CloudWatch log group  (container logs)
::   - ECS cluster           (Fargate)
::   - Security groups       (ALB public :80, tasks internal :5000)
::   - Application Load Balancer + target group + HTTP listener
::   - IAM role              (ecsTaskExecutionRole)
::   - ECS task definition + service (1 task, desired count 1)
::
:: Prerequisites:
::   - AWS CLI installed and configured (aws configure)
::
:: Usage:
::   infra-setup.cmd <REGION>
:: Example:
::   infra-setup.cmd eu-central-1
:: ============================================================

set REGION=%1

if "%REGION%"=="" (
    echo ERROR: REGION is required.
    echo Usage: infra-setup.cmd ^<REGION^>
    exit /b 1
)

echo Resolving AWS account ID from current session...
for /f "delims=" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
if "%ACCOUNT_ID%"=="" (
    echo ERROR: Could not resolve account ID. Check your AWS credentials.
    exit /b 1
)

set APP=resin-calculator
set CLUSTER=%APP%-cluster
set ECR_REPO=%APP%
set LOG_GROUP=/ecs/%APP%
set TASK_FAMILY=%APP%
set SERVICE=%APP%-service
set ALB_NAME=%APP%-alb
set TG_NAME=%APP%-tg

echo.
echo === Resin Calculator - ECS Fargate Infrastructure Setup ===
echo Region:     %REGION%
echo Account ID: %ACCOUNT_ID%
echo.

:: ── 1. ECR repository ──────────────────────────────────────
echo [1/9] ECR repository...
for /f "delims=" %%i in ('aws ecr describe-repositories --repository-names %ECR_REPO% --region %REGION% --query "repositories[0].repositoryName" --output text 2^>nul') do set ECR_EXISTS=%%i
if "%ECR_EXISTS%"=="%ECR_REPO%" (
    echo       Already exists, skipping.
) else (
    aws ecr create-repository --repository-name %ECR_REPO% --region %REGION% --image-scanning-configuration scanOnPush=true
)

:: ── 2. CloudWatch log group ────────────────────────────────
echo [2/9] CloudWatch log group...
for /f "delims=" %%i in ('aws logs describe-log-groups --log-group-name-prefix %LOG_GROUP% --region %REGION% --query "logGroups[0].logGroupName" --output text 2^>nul') do set LG_EXISTS=%%i
if "%LG_EXISTS%"=="%LOG_GROUP%" (
    echo       Already exists, skipping.
) else (
    aws logs create-log-group --log-group-name %LOG_GROUP% --region %REGION%
)

:: ── 3. ECS cluster ─────────────────────────────────────────
echo [3/9] ECS cluster...
for /f "delims=" %%i in ('aws ecs describe-clusters --clusters %CLUSTER% --region %REGION% --query "clusters[?status==`ACTIVE`].clusterName" --output text 2^>nul') do set CLUSTER_EXISTS=%%i
if "%CLUSTER_EXISTS%"=="%CLUSTER%" (
    echo       Already exists, skipping.
) else (
    aws ecs create-cluster --cluster-name %CLUSTER% --region %REGION% --capacity-providers FARGATE --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
)

:: ── 4. Resolve default VPC and subnets ────────────────────
echo [4/9] Resolving default VPC and subnets...
for /f "delims=" %%i in ('powershell -Command "aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query Vpcs[0].VpcId --output text --region %REGION%"') do set VPC_ID=%%i
if "%VPC_ID%"=="" (echo ERROR: Could not find default VPC. & exit /b 1)
echo       VPC: %VPC_ID%

set SUBNET_IDS_SPACE=
set SUBNET_IDS_JSON=
for /f "tokens=*" %%i in ('powershell -Command "aws ec2 describe-subnets --filters Name=vpc-id,Values=%VPC_ID% --query \"Subnets[*].SubnetId\" --output text --region %REGION%"') do (
    for %%s in (%%i) do (
        set SUBNET_IDS_SPACE=!SUBNET_IDS_SPACE! %%s
        if "!SUBNET_IDS_JSON!"=="" (set SUBNET_IDS_JSON="%%s") else (set SUBNET_IDS_JSON=!SUBNET_IDS_JSON!,"%%s")
    )
)
if "%SUBNET_IDS_JSON%"=="" (echo ERROR: No subnets found in VPC %VPC_ID%. & exit /b 1)
echo       Subnets: %SUBNET_IDS_JSON%

:: ── 5. Security groups ─────────────────────────────────────
echo [5/9] Security groups...

for /f "delims=" %%i in ('powershell -Command "aws ec2 describe-security-groups --filters Name=group-name,Values=%APP%-alb-sg Name=vpc-id,Values=%VPC_ID% --query SecurityGroups[0].GroupId --output text --region %REGION%"') do set ALB_SG=%%i
if "%ALB_SG%"=="None" set ALB_SG=
if not "%ALB_SG%"=="" (
    echo       ALB SG already exists: %ALB_SG%
) else (
    aws ec2 create-security-group --group-name %APP%-alb-sg --description ALB-resin-calculator --vpc-id %VPC_ID% --region %REGION%
    for /f "delims=" %%i in ('powershell -Command "aws ec2 describe-security-groups --filters Name=group-name,Values=%APP%-alb-sg Name=vpc-id,Values=%VPC_ID% --query SecurityGroups[0].GroupId --output text --region %REGION%"') do set ALB_SG=%%i
    aws ec2 authorize-security-group-ingress --group-id %ALB_SG% --protocol tcp --port 80 --cidr 0.0.0.0/0 --region %REGION%
    echo       Created ALB SG: %ALB_SG%
)

for /f "delims=" %%i in ('powershell -Command "aws ec2 describe-security-groups --filters Name=group-name,Values=%APP%-task-sg Name=vpc-id,Values=%VPC_ID% --query SecurityGroups[0].GroupId --output text --region %REGION%"') do set TASK_SG=%%i
if "%TASK_SG%"=="None" set TASK_SG=
if not "%TASK_SG%"=="" (
    echo       Task SG already exists: %TASK_SG%
) else (
    aws ec2 create-security-group --group-name %APP%-task-sg --description Fargate-tasks --vpc-id %VPC_ID% --region %REGION%
    for /f "delims=" %%i in ('powershell -Command "aws ec2 describe-security-groups --filters Name=group-name,Values=%APP%-task-sg Name=vpc-id,Values=%VPC_ID% --query SecurityGroups[0].GroupId --output text --region %REGION%"') do set TASK_SG=%%i
    aws ec2 authorize-security-group-ingress --group-id %TASK_SG% --protocol tcp --port 5000 --source-group %ALB_SG% --region %REGION%
    echo       Created task SG: %TASK_SG%
)

:: ── 6. ALB + Target Group + Listener ──────────────────────
echo [6/9] ALB, target group and listener...

for /f "delims=" %%i in ('aws elbv2 describe-load-balancers --names %ALB_NAME% --query "LoadBalancers[0].LoadBalancerArn" --output text --region %REGION% 2^>nul') do set ALB_ARN=%%i
if "%ALB_ARN%"=="None" set ALB_ARN=
if not "%ALB_ARN%"=="" (
    echo       ALB already exists, skipping.
) else (
    aws elbv2 create-load-balancer --name %ALB_NAME% --subnets %SUBNET_IDS_SPACE% --security-groups %ALB_SG% --scheme internet-facing --type application --ip-address-type ipv4 --region %REGION% >nul
    for /f "delims=" %%i in ('aws elbv2 describe-load-balancers --names %ALB_NAME% --query "LoadBalancers[0].LoadBalancerArn" --output text --region %REGION%') do set ALB_ARN=%%i
    echo       Created ALB: %ALB_ARN%
)

for /f "delims=" %%i in ('aws elbv2 describe-target-groups --names %TG_NAME% --query "TargetGroups[0].TargetGroupArn" --output text --region %REGION% 2^>nul') do set TG_ARN=%%i
if "%TG_ARN%"=="None" set TG_ARN=
if not "%TG_ARN%"=="" (
    echo       Target group already exists, skipping.
) else (
    aws elbv2 create-target-group --name %TG_NAME% --protocol HTTP --port 5000 --vpc-id %VPC_ID% --target-type ip --health-check-path /health --health-check-interval-seconds 30 --healthy-threshold-count 2 --region %REGION% >nul
    for /f "delims=" %%i in ('aws elbv2 describe-target-groups --names %TG_NAME% --query "TargetGroups[0].TargetGroupArn" --output text --region %REGION%') do set TG_ARN=%%i
    echo       Created target group: %TG_ARN%
)

for /f "delims=" %%i in ('aws elbv2 describe-listeners --load-balancer-arn %ALB_ARN% --region %REGION% --query "Listeners[0].ListenerArn" --output text 2^>nul') do set LISTENER_ARN=%%i
if "%LISTENER_ARN%"=="None" set LISTENER_ARN=
if not "%LISTENER_ARN%"=="" (
    echo       Listener already exists, skipping.
) else (
    aws elbv2 create-listener --load-balancer-arn %ALB_ARN% --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=%TG_ARN% --region %REGION%
    echo       Created HTTP:80 listener.
)

:: ── 7. ECS Task Execution Role ────────────────────────────
echo [7/9] ECS task execution role...
for /f "delims=" %%i in ('aws iam get-role --role-name ecsTaskExecutionRole --query "Role.RoleName" --output text 2^>nul') do set ROLE_EXISTS=%%i
if "%ROLE_EXISTS%"=="ecsTaskExecutionRole" (
    echo       Already exists, skipping.
) else (
    aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"ecs-tasks.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}"
    aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    echo       Created ecsTaskExecutionRole.
)

:: ── 8. Register task definition ───────────────────────────
echo [8/9] Task definition...
set TD_TMP=%TEMP%\td_resolved.json

(
echo {
echo   "family": "resin-calculator",
echo   "networkMode": "awsvpc",
echo   "requiresCompatibilities": ["FARGATE"],
echo   "cpu": "256",
echo   "memory": "512",
echo   "executionRoleArn": "arn:aws:iam::%ACCOUNT_ID%:role/ecsTaskExecutionRole",
echo   "containerDefinitions": [
echo     {
echo       "name": "resin-calculator",
echo       "image": "%ACCOUNT_ID%.dkr.ecr.%REGION%.amazonaws.com/resin-calculator:latest",
echo       "portMappings": [{"containerPort": 5000, "protocol": "tcp"}],
echo       "essential": true,
echo       "logConfiguration": {
echo         "logDriver": "awslogs",
echo         "options": {
echo           "awslogs-group": "/ecs/resin-calculator",
echo           "awslogs-region": "%REGION%",
echo           "awslogs-stream-prefix": "ecs"
echo         }
echo       }
echo     }
echo   ]
echo }
) > %TD_TMP%

aws ecs register-task-definition --cli-input-json file://%TD_TMP% --region %REGION%

:: ── 9. Create ECS service ─────────────────────────────────
echo [9/9] ECS service...
for /f "delims=" %%i in ('aws ecs describe-services --cluster %CLUSTER% --services %SERVICE% --region %REGION% --query "services[?status==`ACTIVE`].serviceName" --output text 2^>nul') do set SVC_EXISTS=%%i
if "%SVC_EXISTS%"=="%SERVICE%" (
    echo       Already exists, skipping.
) else (
    aws ecs create-service ^
        --cluster %CLUSTER% ^
        --service-name %SERVICE% ^
        --task-definition %TASK_FAMILY% ^
        --desired-count 1 ^
        --launch-type FARGATE ^
        --network-configuration "awsvpcConfiguration={subnets=[%SUBNET_IDS_JSON%],securityGroups=[%TASK_SG%],assignPublicIp=ENABLED}" ^
        --load-balancers "targetGroupArn=%TG_ARN%,containerName=%APP%,containerPort=5000" ^
        --health-check-grace-period-seconds 30 ^
        --region %REGION%
)

:: ── Done ───────────────────────────────────────────────────
echo.
echo === Infrastructure setup complete ===
echo.
for /f "delims=" %%i in ('aws elbv2 describe-load-balancers --names %ALB_NAME% --query "LoadBalancers[0].DNSName" --output text --region %REGION%') do set ALB_DNS=%%i
echo App will be available at: http://%ALB_DNS%
echo (ALB may take ~2 minutes to become active after the first deploy.)
