# Production deployment

## Current architecture

| Stack | Resources |
|---|---|
| `InfraStack` | ECR, Cognito user pool/app client/Hosted UI domain, CloudWatch log group |
| `AppStack` | ECS/Fargate, HTTPS ALB, ACM, Route 53 alias, DynamoDB entitlements, CloudWatch alarms |

Production is a FastAPI application with a packaged React SPA and read-only public content. Editorial tooling and DeepL integration are local-only. DynamoDB stores commercial entitlements; browser local storage stores user preferences.

## Deployment blockers

None currently known. The Dockerfile's static asset path and Python dependency install previously mismatched FastAPI's serving path and `uv.lock`; both are fixed.

## Prerequisites

- AWS CLI v2, configured as profile `hfzwood`
- Node.js 24 LTS and AWS CDK CLI
- Docker
- Route 53 hosted zone for `hfzwood.com`

Windows setup:

```powershell
winget upgrade Amazon.AWSCLI
npm install -g aws-cdk
aws login --profile hfzwood
aws sts get-caller-identity --profile hfzwood
```

The documented account is `325866321073` in `eu-central-1`.

## First deployment

Run these from the repository root unless stated otherwise.

1. Install CDK dependencies and bootstrap the account:

   ```powershell
   Set-Location deployment\cdk
   npm install
   cdk bootstrap --profile hfzwood aws://325866321073/eu-central-1
   ```

2. Deploy shared infrastructure:

   ```powershell
   cdk deploy InfraStack --profile hfzwood
   ```

3. Build and push the image. Run this from WSL so you don't have to install docker in Windows:

   ```bash
   cd /mnt/e/Programare/resin-calculator/deployment
   aws login --profile hfzwood
   
   REGION=eu-central-1
   ACCOUNT_ID=325866321073
   ECR_URI=$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/resin-calculator
   
   POOL_ID=$(aws cloudformation describe-stacks --stack-name InfraStack --region $REGION --profile hfzwood --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
   CLIENT_ID=$(aws cloudformation describe-stacks --stack-name InfraStack --region $REGION --profile hfzwood --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)
   
   docker build -f Dockerfile -t resin-calculator \
     --build-arg VITE_AUTH_MODE=cognito \
     --build-arg VITE_COGNITO_USER_POOL_ID=$POOL_ID \
     --build-arg VITE_COGNITO_CLIENT_ID=$CLIENT_ID \
     --build-arg VITE_COGNITO_DOMAIN=resin-calculator-325866321073.auth.$REGION.amazoncognito.com \
     --build-arg VITE_COGNITO_REDIRECT_URI=https://hfzwood.com/callback \
     ..
   
   aws ecr get-login-password --region $REGION --profile hfzwood | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
   docker tag resin-calculator:latest $ECR_URI:latest
   docker push $ECR_URI:latest
   ```

   Required frontend build arguments are `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_DOMAIN`, and `VITE_COGNITO_REDIRECT_URI`. The frontend always uses Cognito.

4. Deploy the application stack:

   ```commandline
   cdk deploy AppStack --profile hfzwood
   ```

   `AppStack` requires the ECR image and Route 53 hosted zone to exist.

## Runtime configuration

`AppStack` injects the following configuration:

| Variable | Source |
|---|---|
| `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_REGION` | `InfraStack` and deployment region |
| `ENTITLEMENTS_TABLE_NAME` | `hfzwood-entitlements` DynamoDB table |
| `CORS_ALLOWED_ORIGINS` | `https://hfzwood.com` |
| `STRIPE_PRICE_ID` | CDK context `stripePriceId` or `HFZWOOD_STRIPE_PRICE_ID` |
| Stripe URLs | Fixed `https://hfzwood.com/account` routes |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Secrets Manager secret `hfzwood/stripe` |

`AUTH_MODE=cognito` is currently set by CDK but is not read by the backend; Cognito is enforced by the required `COGNITO_*` variables. `CONTENT_DATA_DIR` and `DEEPL_*` must not be set in production.

Create Stripe secrets before commercial Checkout is enabled:

```powershell
aws secretsmanager create-secret --name hfzwood/stripe --secret-string '{"secret_key":"sk_live_...","webhook_secret":"whsec_..."}' --region eu-central-1 --profile hfzwood
Set-Location deployment\cdk
cdk deploy AppStack --profile hfzwood -c stripePriceId=price_...
```

Configure Stripe webhooks for `https://hfzwood.com/api/billing/webhook`:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Editorial releases

1. Run local editorial tooling with `./dev.cmd` and DeepL credentials in untracked `dev.local.cmd`.
2. Edit, translate, review, and publish content locally.
3. Commit the resulting content changes.
4. Build and push an image from that commit, then force an ECS rollout.

Production has no `/admin` or `/api/admin/**` routes and must not receive DeepL credentials.

## Redeploy an image

After pushing a replacement image:

```commandline
deploy-app.cmd eu-central-1 hfzwood
```

The script forces a new ECS deployment and waits for stability. Its internal comments still use the obsolete name `deploy.cmd`; invoke `deploy-app.cmd`.

## Smoke test and release gate

After deployment:

1. `GET https://hfzwood.com/health` returns `{"status":"ok"}`.
2. Cognito sign-in completes and returns to `/callback`.
3. Authenticated Manual, Glossary, Knowledge Base, and website content load from the released image.
4. The ECS task can read and write `hfzwood-entitlements`.
5. Stripe Checkout, Portal, and signed webhooks update DynamoDB entitlements.
6. A forced replacement preserves packaged content and commercial state.
7. ALB and ECS alarms are visible in CloudWatch.

This live validation remains required by `documentation/phase-6-simplified-execution-plan.md`.

## Operations

- `hfzwood-entitlements` uses on-demand capacity, a `stripeCustomerId-index` GSI, and point-in-time recovery.
- The ECS task role has DynamoDB read/write access. Local development assumes that role through `dev.cmd`.
- CloudWatch alarms cover unhealthy ALB targets and fewer than one running ECS task. CDK does not configure SNS/email actions.
- The service runs with 0.25 vCPU, 512 MiB memory, and desired count 1. Do not scale without an approved design.

## Teardown

```powershell
Set-Location deployment\cdk
.\delete-infra.ps1 hfzwood
```

This destroys both CDK stacks and the bootstrap stack. It deletes the Cognito user pool, log group, ECR repository, and all ECR images. The DynamoDB entitlements table uses `RETAIN`; recover it with DynamoDB point-in-time recovery if necessary. A fresh deployment requires bootstrapping, deploying both stacks, and pushing a new image.
