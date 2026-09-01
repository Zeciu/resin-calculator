# Project handover

## Current implementation

- Frontend: React/Vite under `frontend/public/src/`; local-only editorial UI under `frontend/private/`.
- Backend: FastAPI public runtime under `backend/public/`; local-only editorial routes, DeepL integration, and editorial content under `backend/private/`.
- Authentication: Cognito in every environment; no mock-auth or administrator-role bypass.
- Projects: local canonical `.hfzproject` v2 files. Foreign-owned or ownerless files are read-only in the application.
- Content: authored locally into `backend/private/content/`. Admin Publish writes `backend/private/content/published/`. Romanian is the canonical editorial source. `python -m private.tools.package_published_content` copies selected Manual/Knowledge Base/Glossary snapshots into `backend/public/content/` (dry-run by default, locale-scoped). Git commit then Docker-packages the public corpus at `/app/public/content`.
- Commercial access: Stripe webhooks update DynamoDB entitlements; the backend resolves `free` or `subscriber` capabilities.
- Deployment: CDK defines Cognito, ECR, ECS/Fargate, ALB, DNS/TLS, CloudWatch alarms, and DynamoDB entitlements.

## Commands

- Start locally: `./dev.cmd`
- Full validation: `./test.cmd`
- Production frontend build: `npm run build --prefix frontend`
- Package published Manual/KB/Glossary into the public corpus (dry-run default): `uv run --project backend python backend/private/tools/package_published_content.py --module MODULE --locale LOCALE`. See `backend/private/README.md`.

## Local setup prerequisites

- Copy `dev.local.example.cmd` to `dev.local.cmd` (gitignored) and set a real `DEEPL_AUTH_KEY`/`DEEPL_API_BASE_URL`. `dev.cmd` loads it automatically if present.
- AWS CLI must be installed and configured with an `hfzwood` profile (or set `HFZWOOD_AWS_PROFILE` to override). `dev.cmd` assumes the ECS task role through that profile to reach DynamoDB entitlements, and fails fast if the CLI or role assumption is unavailable.
- Local editorial routes mount whenever `backend/private` is importable, which is only true when running from source. Production never has that source, since `backend/private` is excluded from the Docker build context.

## Open work

- Phase 6 live release validation.
- Product-owner QA record for bulk translation scenarios.
- Deferred product work listed in `product-architecture-decisions.md` and `application-design.md`.

Do not use older EFS, mock-auth, S3/content-DynamoDB, or administrator-role notes; they are superseded.

Da. Și aici e bine să separăm două lucruri: proiectul pe care îl construiești tu în aplicație și fișierul canonic pe care aplicația îl servește tuturor ca demo.

În implementarea actuală, Cursor a stabilit deja calea proiectului demo:

frontend/public/static/demo/hfzwood-demo.hfzproject

Acesta este proiectul demo oficial. Oricine apasă „Încearcă un proiect demo” primește o copie în memorie a acestui fișier. Nu proiectul tău din Projects și nu ceva legat de contul tău.

Tu poți însă să alegi foarte ușor ce proiect devine acel fișier.

Cum aș face eu

Te loghezi normal în HFZWood și construiești proiectul exact așa cum vrei să arate demo-ul:

fotografia potrivită → Reference Measurements → Formwork → Wood Islands → Cavities → adâncime rășină → Calculate.

Îl finisezi până când spui: „Ăsta este proiectul pe care vreau să-l vadă toată lumea.”

Apoi îl salvezi normal ca .hfzproject, de exemplu:

HFZWood Demo River Table.hfzproject

Nu contează unde îl salvezi pe PC — Downloads, Desktop etc. Acela este master-ul tău de lucru.

După aceea trebuie să înlocuim fișierul:

frontend/public/static/demo/hfzwood-demo.hfzproject

cu proiectul tău.

Aș păstra însă numele din repository exact hfzwood-demo.hfzproject, indiferent cum se numește proiectul tău original. Motivul e simplu: codul știe deja să ceară /demo/hfzwood-demo.hfzproject. Astfel, când vei vrea peste șase luni să schimbi proiectul demo, nu modificăm codul deloc. Construiești alt proiect → export .hfzproject → înlocuiești asset-ul → teste → commit → deploy.

Și ai control total asupra lui

Asta îmi place la arhitectura pe care a făcut-o Cursor. Demo-ul nu este ascuns într-o bază de date și nu depinde de contul tău. Ai literalmente fișierul:

resin-calculator/frontend/public/static/demo/hfzwood-demo.hfzproject

în repository.

Îl poți chiar păstra separat și pe calculator ca master, dacă vrei.

Foarte important: nu aș copia pur și simplu manual fișierul peste cel actual fără să-i spunem Cursorului. După ce faci proiectul, îi spunem: „acesta este noul canonical demo project; înlocuiește asset-ul și verifică-l prin parser/teste”. Avem deja canonicalDemoProject.test.js tocmai pentru asta.

Și mai e un detaliu important: fă proiectul demo în aplicație exact cum ar trebui să-l vadă vizitatorul la deschidere. Nu doar geometria. Pune valori rezonabile pentru Main Resin Depth și fă un calcul final. Putem decide și valorile inițiale pentru First Fill și Maximum Pour Thickness, dacă vrem să existe deja în proiect sau să le lăsăm utilizatorului să le introducă.

Deci da: îl faci tu, logat, ca pe orice proiect normal, îl salvezi .hfzproject, iar apoi acel fișier devine sursa canonică prin înlocuirea frontend/public/static/demo/hfzwood-demo.hfzproject.

Când îl termini, nu trebuie decât să-mi spui unde l-ai salvat / să-l pui la dispoziția Cursorului și îi dăm un prompt foarte scurt pentru înlocuire și validare.