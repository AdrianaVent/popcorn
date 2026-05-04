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

---

## Before committing (MANDATORY)

After finishing any task and before moving to the commit step, always update:

1. **`CLAUDE.md`** — update the Project Structure section (new files/components/stores) and the Current State table if applicable
2. **`README.md`** — update Features and Project Structure to reflect user-visible changes

Do this without being asked. If either file is out of date, update it as part of the task completion — not as a separate step.

---

## Full workflow — step-by-step authorization (MANDATORY)

Every step requires explicit user approval before moving to the next. Never chain steps automatically.

1. **Commit** — stage and commit → wait for user approval
2. **PR** — create PR → wait for user approval
3. **Merge PR to dev** → wait for user approval
4. **Delete branch** — both local (`git branch -d`) and remote (`git push origin --delete`) → wait for user approval
5. **Merge dev → main** → wait for user approval
6. **Switch back to `dev`** — always the final state

After step 5, always verify main is in sync: `git log --oneline origin/main -3` vs `origin/dev`. If behind, flag it proactively.

**"Continua"** at the end of a session means "proceed with the next pending step in the current flow" — never "start a new feature." Never begin a new feature without the user explicitly naming it.
