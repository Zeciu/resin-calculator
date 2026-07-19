# HFZWood — Product QA Observations

Status
OPEN

Purpose

This document records product observations discovered during real-world usage of HFZWood.

It includes:

- usability improvements;
- workflow friction;
- UX observations;
- reproducible defects;
- feature requests emerging from actual use.

This is intentionally separate from implementation planning.

Items are implementation-neutral and are prioritised independently from development tasks.

---

## Status values

OPEN
UNDER INVESTIGATION
CONFIRMED
NOT REPRODUCED
PLANNED
IMPLEMENTED
CLOSED
## Observation 001

Title

Generate All Translation

Status

IMPLEMENTED — awaiting Product QA validation of Update All Translations (Task B)

Priority

HIGH

Type

Workflow Improvement

Module

Editorial Translation

Observation

Current translation workflow requires manually opening every Manual chapter,
Glossary entry and Knowledge Base article before generating each translation individually.

This workflow becomes increasingly inefficient as the editorial content grows.

Expected behaviour

Provide a Generate All operation capable of processing all missing or outdated translations for the selected module and language automatically.

Reason

Significantly reduces repetitive administrative work.

Notes

This was never part of Task 7.1.4 implementation.
It is a future product capability discovered during Product QA.

Task A (single-item translation update engine) is complete and must be reused by Task B Generate All. Do not duplicate translation logic in the frontend or in a separate bulk pipeline.

Task B delivery (awaiting Product QA CLOSE):

- Admin action: **Update All Translations** (one module + one target locale; never RO).
- Preflight counts (no DeepL) then chunked sequential execution via `TranslationBulkService` → `TranslationUpdateService` only.
- Default policy: generate missing; skip current; sync media-only (0 DeepL); skip text-outdated unless `includeTextOutdated`; always skip manual/untracked; drafts only.
- Process-local duplicate-run lock; no queues/workers/new infrastructure.
- Mark CLOSED only after Product Owner validates Scenarios 1–7.
## Observation 002

Title

Incremental translation and media-only synchronization

Status

IMPLEMENTED — Task A + Task B media-only path proven in automated tests; CLOSED only after Product Owner confirms single-item and Update All media-only QA

Priority

HIGH

Type

Workflow and API Usage Improvement

Module

Editorial Translation

Affected modules

- Manual & Tutorials
- Glossary
- Knowledge Base

Observation

The current translation workflow regenerates the complete translated variant whenever the Romanian canonical content is changed.

This creates unnecessary DeepL API usage in two common situations:

1. A small text modification is made, such as adding or changing one sentence inside a much larger chapter or article.
2. Only language-independent media or structure is changed, such as adding, removing, moving or replacing an image or embedded video.

Current behaviour (before Task A)

When Generate Translation was used again, the complete Romanian content item was sent to DeepL and the complete translated draft was regenerated.

As a result:

- adding one sentence retranslated an entire chapter;
- adding only an image or video still retranslated all textual content;
- previously translated source characters were consumed again.

### Task A delivery (Option B)

Approved architecture uses two RO counters (`sourceRevision`, `sourceTextRevision`) and matching target stamps (`generatedFromSourceRevision`, `generatedFromSourceTextRevision`).

Delivered:

- text vs media-only classification via ordered `extract_translatable_items`;
- media-only synchronization with zero DeepL calls;
- full regeneration when text is outdated (existing overwrite confirmation);
- skip when current; no silent overwrite of manual/untracked targets;
- single-item Generate Translation route now runs the shared update engine.

### Task B note

Update All Translations reuses the same engine: media-only items use `sync_media_only` with zero DeepL in bulk as well.

Explicitly deferred:

- segment-level / paragraph-level incremental DeepL;
- stable block UUID migration.

Expected behaviour

The translation workflow should distinguish between textual changes and language-independent structural or media changes.

A. Incremental text translation

Deferred (segment-level DeepL). Text outdated items still use full-item regeneration under Option B.

B. Media-only synchronization

Implemented in Task A (zero DeepL when `sourceTextRevision` is unchanged).

Expected administrative workflow

The administrator should be able to update or synchronize an outdated foreign-language variant without automatically retranslating the complete content item.

The UI should clearly indicate whether the operation will:

- translate changed text;
- synchronize media only;
- or perform both operations.

Impact

This is important because the DeepL API Developer allowance is limited to 1,000,000 characters in total and does not reset.

Without incremental processing, normal editorial maintenance can repeatedly consume characters for text that has already been translated.

The improvement also supports the intended editorial workflow:

1. create the Romanian textual content;
2. generate launch translations;
3. add or refine images and videos later;
4. synchronize those media changes without paying again for unchanged text;
5. translate only genuinely new or modified text.

Notes

This is not merely a future cost optimisation.

It is a required editorial workflow improvement before large-scale content population and multilingual generation.

Implementation must preserve:

- media position;
- rich-text formatting;
- unchanged translated text;
- manually reviewed or manually edited target-language content;
- overwrite protection;
- translation metadata and outdated-state tracking.

Next step

Perform a pre-implementation investigation of the current rich-text document model, source hashes, translation metadata and HTML structure.

Determine the safest minimal design for segment-level change detection and media-only synchronization before modifying code.
Decision constraint

Before implementation, determine the real complexity, risk and implementation cost of incremental translation and media-only synchronization.

The investigation must explicitly report:

- whether the solution can be implemented safely with limited changes;
- whether it requires a major redesign of the editorial content model;
- whether it risks damaging manually reviewed translations;
- whether it adds substantial code and long-term maintenance burden;
- whether the expected DeepL savings justify the added complexity.

If the implementation is disproportionately complex or risky, do not proceed automatically.

In that case, the product owner may adopt a simpler editorial workflow instead, such as:

- completing the full Romanian canonical content, including media, before generating translations;
- launching initially in Romanian and English only;
- postponing the remaining language generation until the Romanian content is stable;
- accepting full-item regeneration for occasional later changes.

The preferred decision is the simplest safe solution that materially improves the real editorial workflow without delaying launch unnecessarily.
## Observation 003

Title

Rich media survives translation regeneration

Status

CONFIRMED

Priority

INFORMATIONAL

Type

Validation Result

Module

Editorial Translation

Observation

Images and embedded videos remain correctly positioned after translation regeneration.

Result

Validated successfully during Product QA.

No action required.
## Observation 004

Title

HTML entities are double-escaped after AI translation

Status

CLOSED — Product QA PASS

Priority

HIGH

Type

Formatting Defect

Module

Editorial Translation

Observation

AI-generated translations display HTML entities such as:

&amp;#x27;

instead of rendering the expected apostrophe character (').

Examples observed:

d&amp;#x27;humidité
Il s&amp;#x27;agit
L&amp;#x27;utilisation

The issue is visible directly inside the HFZWood editorial editor, not only after copying the text.

Expected behaviour

HTML entities should be decoded correctly before rendering so that translated content displays normal characters.

Expected examples:

d'humidité
Il s'agit
L'utilisation

Impact

Translated editorial content contains visible formatting defects that reduce readability and give the impression of poor translation quality, even though the translation itself is correct.

Notes

Root cause confirmed in the frontend rich-text adapter load path: tag-free HTML skipped entity decoding, so TipTap stored literal entities and Save Draft double-escaped them. DeepL and backend persistence were not the corruption source.

Resolution

Frontend adapter decodes HTML entities when loading persisted HTML into the editor, while save continues to escape once. Shared Manual/Glossary rich-text path covered. Knowledge Base editorial fields remain plain text and were unaffected.

Product QA confirmed apostrophe round-trip after Save Draft / reopen. Closed.

## Observation 005

Title

Editorial collections lack Edit functionality

Status

CLOSED

Priority

HIGH

Type

Workflow Improvement / Data Integrity

Module

Editorial Administration

Observation

Glossary and Knowledge Base entries currently support only Create and Delete operations.

Once an entry has been created, modifying its title or content requires deleting the entry and recreating it from scratch.

Expected behaviour

All editorial collections should support full CRUD operations.

Each existing entry should provide an Edit action allowing the content to be updated without deletion and recreation.

Impact

Significantly improves editorial workflow.

Avoids unnecessary delete/recreate operations.

Preserves existing translations, metadata and future relationships associated with the editorial item.

Modules affected

- Glossary
- Knowledge Base

Notes

This observation was discovered during the migration of the canonical editorial language from English to Romanian.

The same workflow limitation exists consistently across both editorial collections.

### Implementation note (corrected defect)

Product QA clarified that modern select-to-edit + Save Draft already updates locale term/title/body in place under a stable `contentId`. No Edit mode, Rename API, or `contentId` remapping was added.

The real defect was lazy legacy→typed persistence migration: saving the first Romanian variant for a legacy English-origin Glossary/KB entity wrote typed META + typed RO, then removed all legacy keys for that `contentId` without first promoting sibling locales (for example EN). Sibling editorial variants could be deleted.

Correction: shared filesystem migration now promotes every legacy META/VARIANT for the entity to typed keys, verifies promotion is complete, then removes legacy keys. Ordering indexes and cross-reference IDs are unchanged. Draft Save still does not mutate published snapshots.

### Product Owner QA — CLOSED

Confirmed:

- Existing Glossary entries can be edited directly.
- Stable `contentId` is preserved.
- English sibling variants are preserved.
- Legacy migration works correctly.
- Romanian variants can be saved and published.
- Public Romanian Glossary becomes available after successful Publish.

Earlier Product QA failures against Glossary Publish were caused by relationship validation (Related Terms / Synonyms pointing at entries not yet published in the active locale), not by the Observation 005 migration fix.

### Post-QA UX improvements (relationship validation)

Implemented after Observation 005 Product Owner QA CLOSE:

- Glossary Related Terms and Synonyms pickers only offer glossary entries already published in the active admin locale.
- Publish relationship validation errors surface the backend `detail` message (including human-readable term labels) instead of a generic failure string.
- Regression coverage for Save Draft success + Publish rejection, published-only reference search, and Publish success after the referenced entry is published.
## Observation 006

Title

Creating the first Romanian entry fails in Glossary and Knowledge Base

Status

CONFIRMED

Priority

CRITICAL

Type

Backend Defect

Module

Editorial Administration

Affected modules

- Glossary
- Knowledge Base

Observation

Creating and saving the first Romanian entry fails in both Glossary and Knowledge Base.

Steps to reproduce

Glossary:

1. Open Admin → Glossary.
2. Select Romanian (RO).
3. Click Add New Entry.
4. Enter Romanian content.
5. Click Save Draft.

Knowledge Base:

1. Open Admin → Knowledge Base.
2. Select Romanian (RO).
3. Click Add New Entry.
4. Enter Romanian content.
5. Click Save Draft.

Observed behaviour

- The backend returns HTTP 500.
- The interface displays "Request failed (500)".
- The newly created entry does not appear in the list.
- The page continues to display "No RO content yet".

Expected behaviour

The first Romanian entry should be created and saved successfully.

After saving, the entry should appear immediately in the editorial list and become available for translation generation.

Impact

Romanian canonical content cannot be initialized in Glossary or Knowledge Base.

This blocks:

- validation of AI translation for both modules;
- migration from the existing English content to Romanian canonical content;
- normal editorial population of Glossary and Knowledge Base.

Notes

The same failure was reproduced independently in both editorial collections.

This indicates a shared backend or repository-level defect rather than a module-specific UI issue.

Next step

Investigate the shared creation and persistence path used by Glossary and Knowledge Base when saving the first Romanian variant.
## Observation 008 — Locale deletion semantics are unsafe in the multilingual Admin

### Status

CLOSED — Product QA PASS

Approved locale-specific deletion is implemented for Manual & Tutorials, Glossary, and Knowledge Base.

Manual chapter listing keeps entities visible across locales when a locale variant is missing (Glossary / Knowledge Base parity), so locale deletion retains list position and selection while showing the active locale as untranslated.

### Product QA closure evidence

Manual Product QA verified the full multilingual editorial deletion flow in:

- Manual & Tutorials;
- Glossary;
- Knowledge Base.

Verified:

- deleting FR removes only FR;
- RO remains;
- EN remains;
- the entity remains listed and selected;
- FR can be regenerated;
- RO does not offer isolated locale deletion;
- full-entity deletion is separately labeled and warns that all languages will be deleted;
- published FR content no longer shows the deleted item.

### Area

Admin CMS → Manual & Tutorials, Glossary, and Knowledge Base → editorial deletion.

### Severity

Critical — editorial data integrity and destructive-action ambiguity.

### Reproduction

1. Create or generate the same Manual & Tutorials chapter in multiple locales.
2. Confirm that the chapter exists in:
   - Romanian
   - English
   - French
3. Open the French locale.
4. Click the existing Delete action and confirm deletion.
5. Switch to Romanian and English.

### Actual result

Deleting while the French locale is active removes the entire multilingual editorial entity.

The operation deletes:

- the French variant;
- the Romanian canonical variant;
- the English variant;
- every other locale variant attached to the same content item;
- the entity metadata;
- the editorial ordering/index entry.

The selected locale is not included in the deletion request.

The same entity-level deletion architecture is used by:

- Manual & Tutorials;
- Glossary;
- Knowledge Base.

### Diagnostic conclusion

This is not an accidental repository or filesystem failure.

The current behavior is the intentionally implemented entity-level deletion semantics:

- the frontend sends only `contentId`;
- no locale is included in the request;
- the backend exposes only a full entity-delete endpoint;
- the repository removes `META`, every `VARIANT#{locale}`, and the ordering/index entry for that `contentId`.

For Manual & Tutorials, the confirmation text already states that deletion occurs in all languages.

For Glossary and Knowledge Base, the current confirmation is more ambiguous and does not clearly state that every language will be removed.

Although the current implementation is internally consistent, it is unsafe in the multilingual Admin interface.

When French or another translated locale is active, the Delete action reasonably appears to mean deletion of the current translation. The current behavior therefore creates a critical risk of irreversible editorial data loss.

### Product QA evidence

The same Manual & Tutorials chapter existed successfully in:

- Romanian;
- English;
- French.

The French locale was opened and the existing Delete action was confirmed.

Immediately afterward:

- French was absent;
- Romanian was absent;
- English was absent.

The issue is fully reproducible.

### Approved product semantics

#### Non-canonical locales

For English, French, German, Italian, Spanish, Portuguese, Polish, Czech, and any other non-Romanian locale:

- deleting the current translation must remove only the selected locale variant;
- Romanian canonical content must remain unchanged;
- all other translations must remain unchanged;
- entity metadata must remain;
- editorial ordering and index entries must remain;
- the deleted translation must be regeneratable later through the existing translation workflow.

Example:

- Delete FR → FR is removed.
- RO remains.
- EN remains.
- All other locales remain.

#### Canonical Romanian locale

Romanian is the canonical editorial source.

Romanian must not be deletable as an isolated locale variant.

Deleting only Romanian would leave translated variants without their canonical source and would invalidate the current translation model.

When Romanian is active:

- no isolated “Delete Romanian translation” action must be available;
- the only destructive removal option is the separate full-entity deletion action.

#### Full entity deletion

Full entity deletion remains a valid separate operation.

It must be explicitly labeled:

- `Delete chapter in all languages`
- or `Delete entry in all languages`

The confirmation must clearly state that the operation permanently removes:

- Romanian canonical content;
- every translation;
- metadata;
- ordering/index information.

Full entity deletion must not be presented as the same action as deleting the currently selected translation.

### Expected result

For a non-Romanian active locale:

1. Delete the current translation.
2. Only that locale variant is removed.
3. Romanian remains.
4. All other translations remain.
5. Metadata and ordering remain.
6. The item remains visible and selected in the Admin workspace.
7. The deleted translation can be generated again later.

For Romanian:

1. Isolated locale deletion is unavailable.
2. Full entity deletion remains available as a separate, explicitly labeled action.
3. The confirmation clearly states that all languages will be deleted.

### Risk

The current behavior can cause irreversible loss of:

- canonical Romanian content;
- manually reviewed translations;
- generated translations;
- entity metadata;
- editorial ordering.

The ambiguity is especially dangerous when an editor is working inside a translated locale and reasonably expects Delete to affect only that translation.

This blocks safe multilingual editorial work and must be resolved before translation Product QA continues.

### Required implementation

Implement locale-specific deletion for non-canonical variants across:

- Manual & Tutorials;
- Glossary;
- Knowledge Base.

The implementation must:

- add explicit locale-variant deletion operations;
- delete only `VARIANT#{locale}`;
- preserve `META`;
- preserve ordering/index entries;
- preserve all other locale variants;
- correctly remove or rebuild published output for the deleted locale;
- reject isolated deletion of Romanian;
- preserve the existing full entity-delete operation as a separate destructive action;
- clearly distinguish both actions in the Admin UI;
- keep translation generation compatible so a deleted locale can be recreated.

### Required regression coverage

For each affected editorial module:

1. Seed one entity with RO, EN, and FR.
2. Delete FR through the locale-specific action.
3. Confirm FR is absent.
4. Confirm RO remains.
5. Confirm EN remains.
6. Confirm `META` remains.
7. Confirm ordering/index remains.
8. Confirm the FR published snapshot no longer contains the deleted item.
9. Confirm all other locale snapshots remain unchanged.
10. Confirm deleting a missing locale returns the expected not-found result.
11. Confirm isolated deletion of RO is rejected.
12. Confirm full entity deletion still removes all locales, metadata, and ordering.
13. Confirm the frontend uses the locale-specific endpoint when a non-RO locale is active.
14. Confirm the frontend does not offer isolated locale deletion when RO is active.
15. Confirm full entity deletion uses a separate explicit confirmation.

### Product QA required after implementation

1. Create or regenerate the same Manual & Tutorials chapter in RO, EN, and FR.
2. Delete only the French translation.
3. Confirm FR is removed.
4. Confirm RO remains unchanged.
5. Confirm EN remains unchanged.
6. Confirm the chapter remains in the editorial list.
7. Confirm FR can be regenerated.
8. Repeat equivalent deletion checks in Glossary and Knowledge Base.
9. Verify that full entity deletion is separately labeled and clearly warns that all languages will be removed.

### Closure

Manual Product QA completed the checklist above across Manual & Tutorials, Glossary, and Knowledge Base.

Observation 008 is CLOSED — Product QA PASS.
## Session Closure — Product QA Translation Workflow

Today's session completed the multilingual editorial Product QA correction cycle.

Completed

- Observation 004 (HTML entity encoding) — CLOSED — Product QA PASS.
- Observation 008 (safe locale-specific deletion) — implemented and validated manually across:
  - Manual & Tutorials;
  - Glossary;
  - Knowledge Base.
- Repository committed and pushed:
  - Commit: 161845e7286f3fc1c5de9c7189b230171ccb415a
  - Branch: main
- Repository state is clean (only unrelated approved untracked files remain).

Important operational finding

A local DeepL failure was diagnosed as an orphan backend process running without the required environment variables, not an application defect.

Future local DeepL troubleshooting should first verify that only one backend instance is serving port 5000.

Next session

Product QA validate Task B (Update All Translations), then continue remaining observations.

Priority order:

1. Observation 001 — Generate All / Update All Translations (IMPLEMENTED; run Scenarios 1–7, then CLOSE).
2. Observation 002 — Confirm media-only single-item + bulk QA, then CLOSE (segment DeepL remains deferred).
3. Observation 007 — Public Language activation.
4. Observation 005 — Editorial Collection Edit workflow (CLOSED; relationship-picker UX follow-up implemented after QA).

Task B implementation is complete pending Product Owner QA CLOSE.
## Approved Resolution Order

The following execution order has been approved after Product Owner review and shall be preserved throughout the remainder of the editorial implementation. This order is intentional and may only be changed if a newly discovered blocking defect requires it.

1. Complete Observation 006 (Generate All) Product QA and close any remaining implementation defects.
2. Resolve the Admin → Publish → Public Application pipeline so that published editorial content is correctly served by the public application.
3. Complete Observation 007 — Public Language Activation:
   - define when a language becomes publicly visible;
   - separate translation existence from public availability;
   - validate the resulting editorial workflow.
4. Observation 005 — Editorial Collection Edit workflow — CLOSED (legacy sibling migration + relationship-picker UX).
5. Perform a dedicated junk/dead/duplicate code audit only after the editorial workflow is considered feature-complete.
6. Apply only safe cleanup changes and execute the complete validation suite (backend, frontend, build and Product QA).
7. Prepare the Alfred handover package.
8. Execute Task 5.3B live production validation before commercial release.

This checklist represents the approved pre-release completion sequence for the editorial system and shall be used as the reference order until release readiness is achieved.
