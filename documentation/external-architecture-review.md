# External architecture review — follow-up

## Resolved

- Cognito is the only runtime authentication path; production has no mock authentication.
- Backend capability resolution controls `free` and `subscriber` access.
- Project files have format version, project ID, owner ID, primary-image hash, and initial version metadata.
- Editorial translation metadata tracks source revisions for freshness checks.

## Remaining recommendations

### TODO-001 — Editorial revision history and optimistic locking

Source revision counters do not provide editor-facing rollback history or concurrent-edit protection. Add immutable revision records, restore behavior, and optimistic-lock conflicts before collaborative editorial use.

### TODO-002 — API versioning

Current API routes use `/api/` without a version segment. Define a versioning and compatibility policy before publishing a stable external API.

### TODO-003 — Media delivery decision

Media is packaged in the application image. Decide whether CDN delivery is needed before public traffic requires it; no CloudFront distribution exists.

### TODO-004 — Cloud project metadata

Before cloud projects, extend the project format only as needed for content hashing and synchronization metadata, then define ownership and conflict rules.
