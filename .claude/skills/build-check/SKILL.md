---
name: build-check
description: Runs TypeScript type check and ESLint. Use before committing to catch errors early.
allowed-tools: Bash
---

Run the following checks in the project root and report results clearly:

1. **TypeScript type check**
```bash
npx tsc --noEmit
```

2. **ESLint**
```bash
npm run lint
```

If both pass, confirm the code is clean and ready to commit.
If either fails, list the errors grouped by file and explain what needs to be fixed.
