---
name: build-check
description: Runs TypeScript type check, ESLint, Jest tests and Next.js build. Must pass before creating a PR or merging to main.
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

3. **Tests**
```bash
npm test
```

4. **Next.js production build**
```bash
npm run build
```

If all four pass, confirm the code is clean and ready to commit / open a PR.
If any fails, list the errors grouped by file and explain what needs to be fixed.
