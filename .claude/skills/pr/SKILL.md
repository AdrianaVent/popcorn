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
