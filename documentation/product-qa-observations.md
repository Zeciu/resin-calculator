# Product QA observations

## Resolved in code

- Editorial entity migration and relationship validation.
- First Romanian content entry and public-language activation.
- HTML entity handling and locale-variant deletion.
- Translation freshness metadata, media-only synchronization, bulk planning, batching, retry, quota handling, and early-stop reporting.
- Editorial read-amplification fixes and website link/plain-text rendering.

## TODO — product-owner QA

The bulk translation implementation is covered by automated tests, but completion of the following manual scenarios is not recorded:

1. Preview and run a normal bulk translation.
2. Confirm published variants remain unchanged until explicit publish.
3. Confirm partial failures, rate limits, and quota stops report correct results.
4. Confirm media-only updates preserve translations without unnecessary DeepL calls.

Record the result before declaring the bulk workflow fully accepted.

## Deferred

Segment- or paragraph-level incremental DeepL translation is not implemented.