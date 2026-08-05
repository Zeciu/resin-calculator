@echo off
rem Copy this file to dev.local.cmd and insert your real DeepL credentials.
rem dev.local.cmd is gitignored and must never be committed.
rem Do not use setlocal/endlocal in this file so variables persist for dev.cmd.
rem
rem DeepL Free plan base URL:
rem   https://api-free.deepl.com
rem DeepL Pro plan base URL:
rem   https://api.deepl.com
rem
rem Do not echo DEEPL_AUTH_KEY from any startup script.

set "DEEPL_AUTH_KEY=paste_your_real_key_here"
set "DEEPL_API_BASE_URL=https://api-free.deepl.com"
set "DEEPL_TIMEOUT_SECONDS=30"

rem DynamoDB entitlements are mandatory. dev.cmd assumes the ECS task role using
rem the configured hfzwood profile and fails if it cannot establish DynamoDB access.
rem Optionally override the profile name when the default differs:
rem set "HFZWOOD_AWS_PROFILE=hfzwood"
