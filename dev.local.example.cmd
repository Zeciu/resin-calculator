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

set "DEEPL_AUTH_KEY=YOUR_DEEPL_AUTH_KEY_HERE"
set "DEEPL_API_BASE_URL=https://api-free.deepl.com"
set "DEEPL_TIMEOUT_SECONDS=30"
