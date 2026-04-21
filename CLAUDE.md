# Popcorn

Personal movie & series dashboard built with Next.js. Infrastructure ready, features in active development.

## Stack

- **Next.js 16** + React 19 (App Router)
- **TypeScript 5** — path alias `@/*` → `src/*`
- **Tailwind CSS 4** + PostCSS
- **Zustand 5** — global state with localStorage persistence
- **i18next** + react-i18next — ES/EN internationalization
- **jose** — JWT utilities (Edge Runtime compatible)
- **ESLint 9** + Prettier — no semicolons, single quotes

## Structure

```
src/
├── app/
│   ├── api/               # Route Handlers (thin — HTTP in/out only)
│   │   └── auth/
│   │       ├── login/     # POST /api/auth/login  — sets HttpOnly cookie
│   │       └── logout/    # POST /api/auth/logout — clears cookie
│   └── ...                # Pages (App Router)
├── components/            # Text (polymorphic), ThemeSwitcher, LanguageSwitcher
├── config/                # App constants split by domain
│   ├── constants.ts       # General (DEFAULT_LANGUAGE)
│   ├── tmdb.ts            # TMDB_BASE_URL, TMDB_API_KEY
│   └── auth.ts            # DUMMYJSON_LOGIN_URL, TOKEN_MAX_TIME
├── features/              # Feature modules (empty — ready for development)
├── hooks/                 # useTranslation
├── layouts/               # Layout components (empty)
├── locales/               # en.json, es.json
├── middleware.ts          # Route protection — redirects based on token cookie
├── providers/             # GlobalProvider, ThemeProvider, LanguageProvider (client)
├── services/              # All external API clients
│   ├── tmdb/              # TMDB client (movies, series, search)
│   └── auth/              # DummyJSON auth client (empty — ready for development)
├── store/                 # themeStore, languageStore
├── styles/
│   └── theme/             # colors.ts, light.ts, dark.ts, resolveTheme.ts
├── types/                 # TypeScript types (tmdb.ts, ...)
└── utils/                 # Shared utilities (empty)
```

## Architecture Decisions

- **API separation**: `src/app/api/` holds Route Handlers (framework-required location); `src/services/` holds all external API clients. Route Handlers are thin — business logic lives in services.
- **Auth**: HttpOnly cookies only — no localStorage. Cookie (`token`) is set on login and deleted (`maxAge: 0`) on logout. Protected routes handled in `middleware.ts`.
- **TMDB**: Strictly a data provider (movies/series/search). Never used for user authentication.
- **Auto theme**: resolves light (7am–7pm) vs dark based on time of day — see `resolveTheme.ts`
- **Theme applied**: inline styles on provider wrapper, not CSS classes
- **State**: separate Zustand stores per domain (theme, language), not a unified store
- **PWA**: manifest + favicons configured in root layout

## Conventions

- New features go in `src/features/`
- External API clients go in `src/services/`
- Route Handlers go in `src/app/api/` and must stay thin
- Reusable components go in `src/components/`
- Constants are split by domain in `src/config/`
- Follow the client provider pattern for global state

## Git Workflow

Branch flow: `feature → dev → main`

- Feature branches are always created from `dev`
- When a PR is approved and working, merge into `dev`
- After merging to `dev`, merge `dev` into `main` to keep it stable
- `dev` is always the active base branch for development
- Feature branches are deleted once merged into `dev`
- `main` is always stable and production-ready
- **All merges and branch deletions require explicit user authorization — never execute the flow autonomously**
