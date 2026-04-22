---
name: new-feature
description: Scaffolds a new feature in src/features/ following the project structure and conventions.
allowed-tools: Bash Read Write
---

Create a new feature module at `src/features/$ARGUMENTS/`.

Use the `auth/login` feature as the reference pattern:
- `src/features/auth/login/LoginFeature.tsx` — main component, orchestrates layout
- `src/features/auth/login/LoginForm.tsx` — form/presentational component (if needed)
- `src/features/auth/login/useLogin.ts` — hook with all state and logic
- `src/features/auth/login/login.service.ts` — API calls only, no UI logic
- `src/features/auth/login/index.ts` — re-exports the main component as default

## Rules
- `'use client'` only on files that use hooks, events or browser APIs
- Inline styles only — no Tailwind utility classes
- All style values in rem
- Theme colors via `useThemeStore()` tokens, palette colors via `colors.*` only when no token applies
- User-facing strings via `t()` — add keys to both `src/locales/en.json` and `src/locales/es.json`
- API calls go in the `.service.ts` file, never directly in the component or hook
- The hook returns a typed object — no prop drilling of raw state

## Output
After creating the files, list what was created and note any i18n keys or API calls that still need to be implemented.
