---
name: i18n-check
description: Verifies that en.json and es.json have the same keys and that no user-facing strings are hardcoded outside t().
allowed-tools: Read Grep Glob
---

Run the following checks and report any issues found.

## 1. Key parity between en.json and es.json

Read both `src/locales/en.json` and `src/locales/es.json`.
Compare their keys recursively. Report:
- Keys present in `en.json` but missing in `es.json`
- Keys present in `es.json` but missing in `en.json`
- Keys where the value is empty string in either file

## 2. Hardcoded user-facing strings in components

Search for string literals inside JSX that look like user-facing text (sentences, labels, messages) and are not wrapped in `t()`.

Focus on files in:
- `src/features/`
- `src/components/`
- `src/app/`

Ignore:
- Class names, style values, URLs, IDs, `aria-label` technical values
- Console logs and comments
- Files under `node_modules/`

## Output

Group findings by check. For each issue include the file path and line number.
If everything is consistent, confirm both files are in sync and no hardcoded strings were found.
