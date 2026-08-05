# Production Deployment (ECS Fargate)

Deploys HFZWood as a single Fargate task behind an HTTPS Application Load Balancer,
with Cognito authentication, a packaged read-only editorial release corpus, and DynamoDB-backed commercial/user state.

Infrastructure is managed with AWS CDK (TypeScript) as **two stacks**:

| Stack | Purpose |
|---|---|
| `InfraStack` | ECR repository, Cognito user pool / app client / Hosted UI domain, CloudWatch log group |
| `AppStack` | ECS cluster, ALB, ACM certificate, Route 53 record, Fargate service, packaged editorial corpus, DynamoDB table for entitlements |

## Repository layout

| Path | Purpose |
|---|---|
| `cdk/bin/app.ts` | CDK entry point (wires InfraStack → AppStack) |
| `cdk/lib/infra-stack.ts` | Shared infrastructure (ECR, Cognito, logs) |
| `cdk/lib/app-stack.ts` | Application runtime (ECS, ALB, DynamoDB, DNS/TLS) |
| `cdk/package.json` | CDK TypeScript dependencies |
| `cdk/tsconfig.json` | TypeScript config |
| `cdk/cdk.json` | CDK toolkit config |
| `cdk/hfzwood-iam-policy.json` | IAM policy for the deployment user |
| `cdk/delete-infra.ps1` | Destroys AppStack, InfraStack, and CDK bootstrap |
| `deploy-app.cmd` | Forces a new ECS deployment after an image push |
| `old/` | Legacy shell scripts (reference only) |

## Editorial authoring and release policy

Production is a **public reader and application runtime**, not an editorial-authoring environment.

- The administrator runs the Admin module locally, with local mock-admin access and DeepL credentials in the gitignored `dev.local.cmd` file described in the root [`README.md`](../README.md).
- The administrator edits, translates, reviews, and publishes the Manual, Glossary, Knowledge Base, and website content locally. DeepL credentials must never be placed in AWS Secrets Manager, ECS task secrets, or the production container environment.
- After the editorial change is complete, the administrator commits the updated Git-tracked content. The deployer builds an image from that commit, pushes it to ECR, and forces a new ECS deployment.
- The production image reads the resulting frozen public corpus from `/app/content`. The Docker build copies only public frontend/backend source; it does not contain editorial routes, authoring UI, or DeepL code.

Production `/admin` and `/api/admin/**` are absent. Do not use production for authoring or translation.

### Editorial release workflow

1. On the administrator workstation, configure local DeepL as described in the root [`README.md`](../README.md#local-deepl-configuration-windows) and start `./dev.cmd`.
2. Use the local Admin module to update the Romanian source content, generate/review translations, and publish the local snapshots.
3. Review and commit the changed editorial files to Git. Never commit `dev.local.cmd` or a DeepL key.
4. The deployer builds and pushes the Docker image from that commit, then runs `deploy-app.cmd` as described below.
5. Verify the public Manual, Glossary, Knowledge Base, and website pages after deployment.

## Prerequisites

- AWS CLI v2 configured (see "Install and configure the AWS CLI" below)
- Node.js 24 LTS
- AWS CDK CLI (`npm install -g aws-cdk`)
- Docker available on the machine that builds and pushes the image

## Install and configure the AWS CLI

This is required for `cdk deploy`, and optionally for local development to access the real DynamoDB tables (see the root [`README.md`](../README.md#local-dynamodb-access-windows-optional)).

### 1. Install (Windows)

```powershell
winget install Amazon.AWSCLI
```

Verify it installed correctly:

```cmd
aws --version
```

Expect output like `aws-cli/2.x.x Python/... Windows/...`. If the command is not found, open a new terminal (PATH changes from `winget` require a fresh shell) before trying again.

### 2. Configure the `hfzwood` profile

You need an access key ID and secret access key for the `hfzwood` IAM user (obtain these from whoever administers the AWS account — do not create a new IAM user for this).

```cmd
aws configure --profile hfzwood
```

Enter:

- **AWS Access Key ID:** (provided by the account administrator)
- **AWS Secret Access Key:** (provided by the account administrator)
- **Default region name:** `eu-central-1`
- **Default output format:** `json` (or leave blank)

This writes to `%USERPROFILE%\.aws\credentials` and `%USERPROFILE%\.aws\config`; nothing is written into this repository.

### 3. Verify authentication

```cmd
aws sts get-caller-identity --profile hfzwood
```

Expected output includes `"Account": "325866321073"` and `"Arn": ".../user/hfzwood"`. This is a read-only identity check — it does not create, modify, or delete anything, and is safe to run at any time to confirm which AWS account/identity a profile currently resolves to.

If this fails, double-check the access key/secret entered in step 2, and confirm you were given credentials for the `hfzwood` user specifically (not a different AWS account).

## IAM profile

The `hfzwood` IAM user's deploy permissions are defined in `cdk/hfzwood-iam-policy.json`, but this file is a **reference copy only** — updating it in this repository does not change anything on AWS. `cdk deploy` never applies this file; it manages the CDK-generated *application* roles (the ECS task role, execution role, etc.), not the *deployer's own* IAM permissions.

### Applying policy changes to AWS (manual, console)

The policy is attached to the `hfzwood` user as a **customer-managed policy** (not inline), so it must be created/updated manually through the AWS Console:

1. Sign in to the AWS Console with an **admin/root** identity — the `hfzwood` user cannot grant itself new permissions.
2. Go to **IAM → Policies** and open the managed policy attached to `hfzwood` (for example `hfzwood-deploy-policy`).
3. Edit the policy → JSON tab → replace the contents with the current `cdk/hfzwood-iam-policy.json` from this repository → **Save changes** (this creates a new policy version).
4. If the policy is not yet attached, create it via **Create policy** → JSON tab → paste the file contents → attach it to the `hfzwood` user under **IAM → Users → hfzwood → Permissions → Add permissions → Attach policies directly**.

**Why a managed policy, not inline:** IAM inline policies (attached directly on a user, no separate ARN) are capped at **2,048 characters**. Customer-managed policies (created under IAM → Policies, then attached to the user) are capped at **6,144 characters**. This policy already exceeds 2,048 characters, so it must be a managed policy, not inline, or the console will reject the update with a "characters exceeding limit" error.

When CDK adds new AWS resource types to `AppStack`/`InfraStack`, update `cdk/hfzwood-iam-policy.json` in this repository first, then repeat step 3 above to actually apply it — the file and the live AWS policy must be kept in sync manually.

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

Creates the ECS cluster, HTTPS ALB, ACM certificate, Route 53 alias, Fargate service (`desiredCount: 1`), and the `hfzwood-entitlements` DynamoDB table.

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
| `CONTENT_DATA_DIR` | `/app/content` (packaged, read-only editorial corpus) |
| `ENTITLEMENTS_TABLE_NAME` | `hfzwood-entitlements` (DynamoDB table name) |
| `CORS_ALLOWED_ORIGINS` | `https://hfzwood.com` |
| `STRIPE_PRICE_ID` | Monthly Price ID from CDK context `stripePriceId` or env `HFZWOOD_STRIPE_PRICE_ID` |
| `STRIPE_CHECKOUT_SUCCESS_URL` | `https://hfzwood.com/account?billing=success` |
| `STRIPE_CHECKOUT_CANCEL_URL` | `https://hfzwood.com/account?billing=cancel` |
| `STRIPE_PORTAL_RETURN_URL` | `https://hfzwood.com/account` |
| `STRIPE_SECRET_KEY` | From Secrets Manager secret `hfzwood/stripe` field `secret_key` |
| `STRIPE_WEBHOOK_SECRET` | From Secrets Manager secret `hfzwood/stripe` field `webhook_secret` |

Editorial content and public snapshots are packaged into the Docker image from Git. Commercial entitlements persist in the `hfzwood-entitlements` DynamoDB table. User preferences are stored client-side (browser local storage) and are not persisted server-side. There is no EFS or other filesystem-backed persistence in production.

### Stripe secrets (required before commercial Checkout works)

Create the secret once (JSON keys `secret_key` and `webhook_secret`):

```cmd
aws secretsmanager create-secret --name hfzwood/stripe --secret-string "{\"secret_key\":\"sk_live_...\",\"webhook_secret\":\"whsec_...\"}" --region eu-central-1 --profile hfzwood
```

Point Stripe webhooks at `https://hfzwood.com/api/billing/webhook` for:

* `checkout.session.completed`
* `customer.subscription.updated`
* `customer.subscription.deleted`

Deploy AppStack with the monthly Price ID:

```cmd
cdk deploy AppStack --profile hfzwood -c stripePriceId=price_...
```

Or set `HFZWOOD_STRIPE_PRICE_ID` in the environment before `cdk deploy`.

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
Fargate Task  (desiredCount=1)
   ├── FastAPI + Cognito JWT validation
   ├── React SPA from /static
   ├── Packaged editorial corpus → /app/content  (read-only release mode)
   └── DynamoDB → hfzwood-entitlements  (commercial/user state)

Cognito User Pool + Hosted UI
ECR image :latest
```

## Minimal production smoke test

After deploy:

1. `GET https://hfzwood.com/health` → `{"status":"ok"}`
2. Open `https://hfzwood.com` and complete Cognito login
3. Confirm Manual / Glossary / Knowledge Base public pages load the content from the released Git commit
4. Confirm no `DEEPL_*` values or DeepL secrets are configured for the ECS task
5. Confirm `hfzwood-entitlements` exists and the ECS task role can read/write it (see "DynamoDB tables" below)
6. After a forced task replacement (`deploy-app.cmd`), confirm public editorial content is unchanged and commercial/user state remains available

Full release certification (commercial flows and CloudWatch alarm verification) remains outside this document’s deploy steps and is recorded as **PENDING — LIVE VALIDATION REQUIRED** under Task 5.3B in `documentation/phase-6-simplified-execution-plan.md` §26.5.

## DynamoDB tables

`AppStack` provisions a DynamoDB table for durable per-user commercial state, replacing the filesystem-backed EFS design for this data.

| Table | Purpose | Key schema | Capacity | Recovery |
|---|---|---|---|---|
| `hfzwood-entitlements` | Commercial access tier, Stripe subscription state | PK `userId` (String); GSI `stripeCustomerId-index` on `stripeCustomerId` | On-demand (`PAY_PER_REQUEST`) | Point-in-time recovery enabled |

The table uses `RemovalPolicy.RETAIN`: deleting the CDK stack does not delete the table or its data.

The `stripeCustomerId-index` GSI supports looking up a user by Stripe customer ID (used by webhook processing) without a manual index file or a full table scan.

The ECS task role is granted read/write access to the table (`grantReadWriteData`); no additional Secrets Manager configuration is required for DynamoDB access.

### Local development access

The ECS task role's trust policy also allows the `hfzwood` deployer user to assume it directly (`sts:AssumeRole`), so local development can exercise the exact same DynamoDB permissions the running task has, without a second, separately maintained permission set on `hfzwood` itself. `hfzwood-iam-policy.json` grants `hfzwood` the corresponding `sts:AssumeRole` permission, scoped to `AppStack-*` role ARNs.

`dev.cmd` always resolves and assumes the ECS task role locally, then exports temporary credentials and `ENTITLEMENTS_TABLE_NAME` for the backend. DynamoDB is the only entitlement store; startup fails if this access cannot be established. The current table is shared development data until a separate development environment is deliberately provisioned.

**Verify the table exists (operator):**

```cmd
aws dynamodb describe-table --table-name hfzwood-entitlements --region eu-central-1 --profile hfzwood
```

**Recovery:** use DynamoDB point-in-time recovery (restore to a new table, then repoint if needed). No AWS Backup vault or schedule is used for this table.

## Operational monitoring (ALB + ECS)

`AppStack` creates two CloudWatch alarms:

| Alarm | Meaning | Where to inspect |
|---|---|---|
| `resin-calculator-alb-unhealthy-hosts` | ALB target group has one or more unhealthy hosts | CloudWatch → Alarms; ECS service / Target group health |
| `resin-calculator-ecs-running-tasks-low` | ECS service is running fewer than one task | CloudWatch → Alarms; ECS cluster `resin-calculator-cluster`, service `resin-calculator-service` |

Both alarms use two evaluation periods to reduce transient deployment noise. SNS/email actions are not configured in CDK; subscribe operators manually if desired.

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
| ECR + CloudWatch | usage-based |
| DynamoDB (`hfzwood-entitlements`, on-demand) | usage-based; near-zero at low traffic |

Stop the service when idle:

```cmd
aws ecs update-service --cluster resin-calculator-cluster --service resin-calculator-service --desired-count 0 --region eu-central-1 --profile hfzwood
```

Keep `desiredCount` at `1` for the current deployment unless an independently validated scaling design is approved. Editorial changes are made locally and released through Git.
