# Production Deployment (ECS Fargate)

Deploys HFZWood as a single Fargate task behind an HTTPS Application Load Balancer,
with Cognito authentication and EFS-backed editorial persistence.

Infrastructure is managed with AWS CDK (TypeScript) as **two stacks**:

| Stack | Purpose |
|---|---|
| `InfraStack` | ECR repository, Cognito user pool / app client / Hosted UI domain, CloudWatch log group |
| `AppStack` | ECS cluster, ALB, ACM certificate, Route 53 record, Fargate service, encrypted EFS mount |

## Repository layout

| Path | Purpose |
|---|---|
| `cdk/bin/app.ts` | CDK entry point (wires InfraStack → AppStack) |
| `cdk/lib/infra-stack.ts` | Shared infrastructure (ECR, Cognito, logs) |
| `cdk/lib/app-stack.ts` | Application runtime (ECS, ALB, EFS, DNS/TLS) |
| `cdk/package.json` | CDK TypeScript dependencies |
| `cdk/tsconfig.json` | TypeScript config |
| `cdk/cdk.json` | CDK toolkit config |
| `cdk/hfzwood-iam-policy.json` | IAM policy for the deployment user |
| `cdk/delete-infra.ps1` | Destroys AppStack, InfraStack, and CDK bootstrap |
| `deploy-app.cmd` | Forces a new ECS deployment after an image push |
| `old/` | Legacy shell scripts (reference only) |

## Prerequisites

- AWS CLI v2 configured
- Node.js 24 LTS
- AWS CDK CLI (`npm install -g aws-cdk`)
- Docker available on the machine that builds and pushes the image

## IAM profile

The `hfzwood` IAM user policy lives in `cdk/hfzwood-iam-policy.json`.

```cmd
aws configure --profile hfzwood
```

Use region `eu-central-1`. When CDK adds new AWS resource types, update the IAM policy and re-apply it.

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

### 3. Domain (manual)

Purchase/configure `hfzwood.com` in Route 53 so a hosted zone exists before `AppStack` deploy.

### 4. Deploy InfraStack

```cmd
cd deployment\cdk
cdk deploy InfraStack --profile hfzwood
```

Creates ECR, Cognito, and the `/ecs/resin-calculator` log group.

Inspect outputs:

```cmd
aws cloudformation describe-stacks --stack-name InfraStack --region eu-central-1 --profile hfzwood --query "Stacks[0].Outputs"
```

### 5. Build and push the production Docker image

The image must bake Cognito frontend configuration at build time. Build from the **repository root**.

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
  .

aws ecr get-login-password --region $REGION --profile hfzwood | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
docker tag resin-calculator:latest $ECR_URI:latest
docker push $ECR_URI:latest
```

Required frontend build arguments:

| Build arg | Purpose |
|---|---|
| `VITE_AUTH_MODE=cognito` | Prevents production mock-auth activation |
| `VITE_COGNITO_USER_POOL_ID` | Amplify user pool |
| `VITE_COGNITO_CLIENT_ID` | Amplify app client |
| `VITE_COGNITO_DOMAIN` | Hosted UI domain host |
| `VITE_COGNITO_REDIRECT_URI` | Must match Cognito callback URL (`https://hfzwood.com/callback`) |

### 6. Deploy AppStack

```cmd
cd deployment\cdk
cdk deploy AppStack --profile hfzwood
```

Creates the ECS cluster, HTTPS ALB, ACM certificate, Route 53 alias, Fargate service (`desiredCount: 1`), and encrypted EFS volume mounted at `/mnt/hfzwood-content`.

Requires:

- an image already present in ECR;
- Route 53 hosted zone for `hfzwood.com`.

## Production container environment

Injected by `AppStack` (do not rely on container-local `/app/data`):

| Variable | Value / source |
|---|---|
| `AUTH_MODE` | `cognito` |
| `COGNITO_USER_POOL_ID` | InfraStack user pool |
| `COGNITO_CLIENT_ID` | InfraStack app client |
| `COGNITO_REGION` | Stack region (`eu-central-1`) |
| `CONTENT_DATA_DIR` | `/mnt/hfzwood-content` (EFS mount) |
| `REQUIRE_CONTENT_DATA_DIR` | `1` (fail closed if storage is missing/unwritable) |
| `CORS_ALLOWED_ORIGINS` | `https://hfzwood.com` |

Editorial CMS state, published snapshots, and related filesystem repositories persist on EFS under `CONTENT_DATA_DIR`.

## Redeploying a new image

1. Build and push with the Cognito build args above.
2. From Windows:

```cmd
cd deployment
deploy-app.cmd eu-central-1 hfzwood
```

This forces a new ECS deployment and waits until the service is stable.

## Deployment sequence (summary)

1. `cdk bootstrap` (once)
2. Domain / hosted zone ready
3. `cdk deploy InfraStack`
4. Docker build with Cognito args → tag → push to ECR
5. `cdk deploy AppStack`
6. Later releases: rebuild/push image → `deploy-app.cmd`

## Architecture

```
Internet
   │  HTTPS :443  (HTTP :80 redirects to HTTPS)
   ▼
Application Load Balancer  (resin-calculator-alb)
   │  :5000
   ▼
Fargate Task  (desiredCount=1, single editorial writer)
   ├── FastAPI + Cognito JWT validation
   ├── React SPA from /static
   └── EFS mount → /mnt/hfzwood-content  (CONTENT_DATA_DIR)

Cognito User Pool + Hosted UI
ECR image :latest
```

## Minimal production smoke test

After deploy:

1. `GET https://hfzwood.com/health` → `{"status":"ok"}`
2. Open `https://hfzwood.com` and complete Cognito login
3. Confirm Manual / Glossary / Knowledge Base public pages load
4. As an `administrators` group user, open `/admin` and confirm CMS access
5. After a forced task replacement (`deploy-app.cmd`), confirm editorial content still present (no unexpected reseed)

Full release certification (EFS durability matrix, commercial flows) remains outside this document’s deploy steps.

## Teardown

```powershell
cd deployment\cdk
.\delete-infra.ps1 hfzwood
```

## Cost notes

| Resource | Approx monthly |
|---|---|
| Fargate (0.25 vCPU / 0.5 GB) | ~$9 |
| ALB | ~$18 base + LCU |
| Cognito (≤50k MAU free tier) | $0 |
| EFS + ECR + CloudWatch | usage-based |

Stop the service when idle:

```cmd
aws ecs update-service --cluster resin-calculator-cluster --service resin-calculator-service --desired-count 0 --region eu-central-1 --profile hfzwood
```

Keep `desiredCount` at `1` for production editorial writes unless a separate multi-writer design is approved.
