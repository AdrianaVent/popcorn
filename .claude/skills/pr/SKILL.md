---
name: pr
description: Creates a pull request following project conventions — English, base dev, checked test plan.
allowed-tools: Bash
---

Create a pull request for the current branch following the project conventions.

## Before creating

1. Check current branch: `git branch --show-current`
2. Check for uncommitted changes: `git status --short` — warn if any exist
3. Review recent commits: `git log --oneline origin/dev..HEAD`
4. **Performance review** — analyse the changed files and fix any issues found before opening the PR:
   - **Unnecessary re-renders**: components that receive object/array/function props without stable references — wrap with `useMemo` / `useCallback` / `React.memo` where appropriate
   - **Expensive inline computations**: any non-trivial derivation inside a render function that is not memoized — wrap with `useMemo`
   - **Missing dependency arrays**: `useEffect` / `useMemo` / `useCallback` without deps or with stale deps
   - **Unbounded lists**: list renders over large or unknown-length arrays without pagination or virtualization
   - **Redundant fetches**: multiple hooks or effects triggering the same request — consolidate at the call site
   - **Heavy imports**: newly added imports that pull in large libraries — prefer named imports or lighter alternatives
   - If issues are found: fix them, re-run build-check, then open the PR. Report what was fixed in the PR summary.

## Conventions

- **Language**: title and body always in English
- **Base branch**: always `dev`
- **Test plan**: use `- [x]` for items the user has already validated during the session; `- [ ]` only for untested items

## Format

```
gh pr create --base dev --title "<title>" --body "..."
```

**Title**: short, imperative, under 70 chars. Examples:
- `feat: login UI`
- `fix: middleware skipping api routes`
- `chore: migrate px to rem`

**Body**:
```
## Summary
- bullet points describing what changed and why

## Test plan
- [x] validated item
- [ ] pending item

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Infer the summary and test plan from the commits and the conversation context.
After creating the PR, return the URL.
