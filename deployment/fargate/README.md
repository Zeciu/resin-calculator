# ECS Fargate Deployment

Deploys the resin-calculator as a single Fargate container behind an Application Load Balancer.
The Docker image bundles both the React frontend (pre-built) and the FastAPI backend.

## Files

| File | Purpose |
|---|---|
| `task-definition.json` | ECS task definition template (CPU 256, RAM 512 MB, port 5000) |
| `infra-setup.cmd` | One-time script that creates all AWS infrastructure |
| `deploy.cmd` | Triggers the ECS deployment (run after pushing image from WSL) |

The `Dockerfile` at the project root is what both scripts depend on.

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) installed and configured (`aws configure`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

The scripts resolve your AWS account ID automatically from your active session (`aws sts get-caller-identity`), 
so no manual account ID is needed.

## First-time setup

Run `infra-setup.cmd` once to create all the AWS resources:

```cmd
cd deployment\fargate
infra-setup.cmd <REGION>
```

Example:

```cmd
infra-setup.cmd eu-central-1
```

This script creates:

1. **ECR repository** — stores your Docker images
2. **CloudWatch log group** — `/ecs/resin-calculator`
3. **ECS cluster** — `resin-calculator-cluster` (Fargate capacity provider)
4. **VPC resources** — uses your account's default VPC and subnets
5. **Security groups** — ALB (port 80 public) and task (port 5000, ALB-only)
6. **Application Load Balancer** — internet-facing, HTTP port 80
7. **Target group** — forwards to container port 5000, health-checks `/health`
8. **ECS task execution role** — `ecsTaskExecutionRole` (allows pulling from ECR, writing logs)
9. **ECS task definition** — registers `task-definition.json` with your account/region filled in
10. **ECS service** — `resin-calculator-service`, desired count 1

The script prints the ALB DNS name at the end — that is your app's public URL.

The script is safe to run more than once. Every step checks whether the resource already exists and skips it if so. The one exception is the task definition: ECS always creates a new numbered revision (`:1`, `:2`, …) rather than overwriting. This is harmless — the running service stays pinned to its current revision and ignores the new one until you run `deploy.cmd`.

## Deploying

### 1. Build and push from WSL

Build, run and test locally:
```bash
docker build -t resin-calculator /mnt/e/Programare/resin-calculator
docker run --rm -p 5000:5000 resin-calculator
```

Push the image to ECR:
```
REGION=eu-central-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/resin-calculator

aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
docker tag resin-calculator:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

### 2. Trigger the ECS deployment from Windows

```cmd
deploy.cmd <REGION>
```

Example:

```cmd
deploy.cmd eu-central-1
```

ECS will pull the new image and replace the running task with zero downtime. To wait for the rollout to finish:

```cmd
aws ecs wait services-stable --cluster resin-calculator-cluster --services resin-calculator-service --region <REGION>
```

To wait for the rollout to complete:

```cmd
aws ecs wait services-stable --cluster resin-calculator-cluster --services resin-calculator-service --region <REGION>
```

## Architecture

```
Internet
   │  HTTP :80
   ▼
Application Load Balancer  (resin-calculator-alb)
   │  HTTP :5000
   ▼
Fargate Task  (resin-calculator, 0.25 vCPU / 512 MB)
   ├── FastAPI on port 5000
   └── Serves React frontend from /static (built into the image)
```

## Cost estimate

With a single task running continuously in most EU/US regions:

| Resource | Approx monthly cost |
|---|---|
| Fargate task (0.25 vCPU / 0.5 GB) | ~$9 |
| ALB | ~$18 (base) + ~$0.008/LCU |
| ECR storage (small image) | < $0.01 |
| CloudWatch logs | < $1 |

For occasional or dev use, stop the service when idle:

```cmd
aws ecs update-service --cluster resin-calculator-cluster --service resin-calculator-service --desired-count 0 --region <REGION>
```

Restart with `--desired-count 1`.

## Teardown

To delete all created resources:

```cmd
:: Stop and delete the service
aws ecs update-service --cluster resin-calculator-cluster --service resin-calculator-service --desired-count 0 --region <REGION>
aws ecs delete-service --cluster resin-calculator-cluster --service resin-calculator-service --region <REGION>

:: Delete cluster
aws ecs delete-cluster --cluster resin-calculator-cluster --region <REGION>

:: Delete ALB, target group, listener
aws elbv2 delete-load-balancer --load-balancer-arn <ALB_ARN> --region <REGION>
aws elbv2 delete-target-group --target-group-arn <TG_ARN> --region <REGION>

:: Delete ECR repo (removes all images too)
aws ecr delete-repository --repository-name resin-calculator --force --region <REGION>

:: Delete log group
aws logs delete-log-group --log-group-name /ecs/resin-calculator --region <REGION>

:: Delete security groups (after ALB/tasks are gone)
aws ec2 delete-security-group --group-id <TASK_SG> --region <REGION>
aws ec2 delete-security-group --group-id <ALB_SG> --region <REGION>
```
