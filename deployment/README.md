# ECS Fargate Deployment

Deploys resin-calculator as a single Fargate container behind an Application Load Balancer,
with Cognito for authentication. Infrastructure is managed via AWS CDK (TypeScript).

## Files

| File | Purpose |
|---|---|
| `cdk/bin/app.ts` | CDK entry point |
| `cdk/lib/stack.ts` | All AWS resources in one stack |
| `cdk/package.json` | CDK TypeScript dependencies |
| `cdk/tsconfig.json` | TypeScript config |
| `cdk/cdk.json` | CDK toolkit config |
| `cdk/delete-infra.ps1` | Destroys all AWS infrastructure |
| `cdk/cdk/hfzwood-iam-policy.json` | IAM policy for the deployment user |
| `deploy-app.cmd` | Redeploys the app container after a new image is pushed |
| `old/` | Legacy shell-based deployment scripts (reference only) |

## Prerequisites

- [AWS CLI v2](https://aws.amazon.com/cli/) installed and configured
- [Node.js 24 LTS](https://nodejs.org/) installed (already required for the frontend)
- [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html) installed globally:
  ```cmd
  npm install -g aws-cdk
  ```
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

## IAM permissions for hfzwood

The `hfzwood` IAM user needs a policy that covers all resources the CDK stack creates.
The policy is defined in `cdk/hfzwood-iam-policy.json`.

**Creating the user and configuring the CLI profile:**
1. Go to **IAM → Users → Create user**, name it `hfzwood`
2. Go to **IAM → Users → hfzwood → Security credentials → Create access key**
3. Configure the CLI profile locally:
```cmd
aws configure --profile hfzwood
```
Enter the Access Key ID, Secret Access Key, region `eu-central-1`, output `json`.

**Applying the policy (AWS console):**
1. Go to **IAM → Users → hfzwood → Add permissions**
2. Choose **Create inline policy → JSON**
3. Paste the contents of `cdk/hfzwood-iam-policy.json`
4. Name it `hfzwood-deploy` and save

> Every time a new AWS resource type is added to `stack.ts`, the corresponding actions must also be added to
> `cdk/hfzwood-iam-policy.json` and the policy re-applied.

## First-time setup

### 1. Install CDK dependencies

```cmd
cd deployment\cdk
npm install
```

### 2. Bootstrap CDK (once per account/region)

```cmd
cdk bootstrap --profile hfzwood aws://325866321073/eu-central-1
```

### 4. Buy domain `hfzwood.com` via Route 53 (manual)

Go to [Route 53 → Domain Registration](https://console.aws.amazon.com/route53/home#DomainRegistration) and purchase `hfzwood.com`.
Route 53 automatically creates a hosted zone for the domain.

### 5. Deploy infrastructure (InfraStack)

```cmd
cd deployment\cdk
cdk deploy InfraStack --profile hfzwood
```

Creates ECR, Cognito, and CloudWatch. Completes in ~1 minute.

Get Cognito values from outputs and update dev.cmd
```cmd
aws cloudformation describe-stacks --stack-name InfraStack --region eu-central-1 --profile hfzwood --query "Stacks[0].Outputs"
```

### 6. Build and push the Docker image (from WSL)

```bash
REGION=eu-central-1
ACCOUNT_ID=325866321073
ECR_URI=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/resin-calculator

POOL_ID=$(aws cloudformation describe-stacks --stack-name InfraStack --region $REGION --profile hfzwood --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name InfraStack --region $REGION --profile hfzwood --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)

docker build -t resin-calculator \
  --build-arg VITE_AUTH_MODE=cognito \
  --build-arg VITE_COGNITO_USER_POOL_ID=$POOL_ID \
  --build-arg VITE_COGNITO_CLIENT_ID=$CLIENT_ID \
  --build-arg VITE_COGNITO_DOMAIN=resin-calculator-325866321073.auth.$REGION.amazoncognito.com \
  --build-arg VITE_COGNITO_REDIRECT_URI=https://hfzwood.com/callback \
  /mnt/e/Programare/resin-calculator

aws ecr get-login-password --region $REGION --profile hfzwood | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
docker tag resin-calculator:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

### 7. Deploy app infrastructure (AppStack)

```cmd
cd deployment\cdk
cdk deploy AppStack --profile hfzwood
```

Creates ECS cluster, ALB, ACM certificate, Route 53 DNS record, and Fargate service.
Requires the image to exist in ECR (step 6) and the domain to be active in Route 53 (step 4).

## Deploying a new image

### 1. Build and push from WSL

```bash
REGION=eu-central-1
ACCOUNT_ID=325866321073
ECR_URI=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/resin-calculator

POOL_ID=$(aws cloudformation describe-stacks --stack-name InfraStack --region $REGION --profile hfzwood --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name InfraStack --region $REGION --profile hfzwood --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)

docker build -t resin-calculator \
  --build-arg VITE_AUTH_MODE=cognito \
  --build-arg VITE_COGNITO_USER_POOL_ID=$POOL_ID \
  --build-arg VITE_COGNITO_CLIENT_ID=$CLIENT_ID \
  --build-arg VITE_COGNITO_DOMAIN=resin-calculator-325866321073.auth.$REGION.amazoncognito.com \
  --build-arg VITE_COGNITO_REDIRECT_URI=https://hfzwood.com/callback \
  /mnt/e/Programare/resin-calculator

aws ecr get-login-password --region $REGION --profile hfzwood | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
docker tag resin-calculator:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

### 2. Trigger ECS redeployment from Windows

```cmd
cd deployment
deploy-app.cmd eu-central-1 hfzwood
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

Cognito User Pool  (email/password auth + Hosted UI)
```

## Teardown

```powershell
cd deployment\cdk
.\delete-infra.ps1 hfzwood
```

This destroys both `AppStack` and `InfraStack` and removes the CDK bootstrap stack.

## Cost estimate

| Resource | Approx monthly cost |
|---|---|
| Fargate task (0.25 vCPU / 0.5 GB) | ~$9 |
| ALB | ~$18 base + ~$0.008/LCU |
| Cognito (≤50 000 MAU free tier) | $0 |
| ECR + CloudWatch | < $1 |

Stop the service when idle:

```cmd
aws ecs update-service --cluster resin-calculator-cluster --service resin-calculator-service --desired-count 0 --region eu-central-1 --profile hfzwood
```
