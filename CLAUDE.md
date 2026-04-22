# Popcorn

Personal movie & series dashboard built with Next.js. Login UI complete, dashboard features in active development.

## Stack

- **Next.js 16** + React 19 (App Router)
- **TypeScript 5** — path alias `@/*` → `src/*`
- **Tailwind CSS 4** + PostCSS
- **Zustand 5** — global state with localStorage persistence
- **i18next** + react-i18next — ES/EN internationalization
- **jose** — JWT utilities (Edge Runtime compatible)
- **clsx** — conditional class merging
- **ESLint 9** + Prettier — no semicolons, single quotes

## Structure

```
src/
├── app/
│   ├── api/                        # Route Handlers (thin — HTTP in/out only)
│   │   └── auth/
│   │       ├── login/              # POST /api/auth/login  — sets token + refresh_token cookies
│   │       ├── logout/             # POST /api/auth/logout — clears both cookies
│   │       └── refresh/            # POST /api/auth/refresh — renews both cookies
│   ├── login/page.tsx              # Login page (ssr: false via dynamic import)
│   └── page.tsx                    # Home page (temporary auth demo — will become dashboard)
├── components/
│   ├── common/                     # ThemeSwitcher, LanguageSwitcher
│   ├── layouts/                    # AuthLayout
│   └── ui/                         # Button, Input, Text (polymorphic), LoginSkeleton
├── config/                         # App constants split by domain
│   ├── constants.ts                # DEFAULT_LANGUAGE
│   ├── i18n.ts                     # i18next config
│   └── auth.ts                     # TOKEN_MAX_TIME, REFRESH_TOKEN_MAX_TIME
├── features/
│   └── auth/login/                 # LoginFeature, LoginForm, useLogin, login.service.ts
├── hooks/                          # useTranslation
├── locales/                        # en.json, es.json — auth.errors, auth.success, tmdb.errors, login.*
├── middleware.ts                   # Route protection — skips /api/*, redirects based on token cookie
├── providers/                      # GlobalProvider, ThemeProvider, LanguageProvider (client)
├── services/
│   ├── auth/                       # DummyJSON client — login(), refresh(); config.ts
│   └── tmdb/                       # TMDB client — movies, series, search; config.ts
├── store/                          # themeStore, languageStore (Zustand + persist)
├── styles/
│   ├── theme/                      # colors.ts, light.ts, dark.ts, resolveTheme.ts, types.ts
│   └── typography.ts               # textStyles (size + lineHeight per variant)
├── types/                          # tmdb.ts, languageTypes.ts
└── utils/
    └── tmdb.ts                     # getTMDBImageUrl(path, size)
```

## Current State

| Area | Status |
|---|---|
| Theme system (light/dark/auto) | Done |
| Internationalization (ES/EN) | Done |
| Auth service (login/logout/refresh) | Done |
| Route protection (middleware) | Done |
| TMDB service (movies/series/search) | Done |
| TMDB image helper | Done |
| i18n error codes (auth + TMDB) | Done |
| Login UI | Done |
| Dashboard UI | Not started |
| Movies / Series pages | Not started |

## Architecture Decisions

- **API separation**: `src/app/api/` holds Route Handlers; `src/services/` holds all external API clients. Route Handlers are thin — business logic lives in services.
- **Auth**: Two HttpOnly cookies — `token` (1h) and `refresh_token` (7d). Set on login, both cleared on logout or failed refresh. Protected routes handled in `middleware.ts`.
- **Auth provider**: DummyJSON (`dummyjson.com/auth`) for login/refresh. Login field accepts username (not email) — DummyJSON's `/auth/login` expects a `username` field. Test credentials: `emilys` / `emilyspass`.
- **TMDB**: Strictly a data provider (movies/series/search). Never used for user authentication.
- **Error codes**: API responses return `{ code: string }` — never hardcoded text. Frontend translates via i18next (`auth.errors.*`, `tmdb.errors.*`).
- **Auto theme**: resolves light (7am–7pm) vs dark based on time of day — see `resolveTheme.ts`.
- **Theme (pending migration)**: currently applied via inline styles on the ThemeProvider wrapper using Zustand `theme.*` tokens. Planned migration: CSS custom properties on `:root` / `[data-theme]` so Tailwind utility classes consume them instead of inline styles.
- **State**: separate Zustand stores per domain (theme, language). `partialize` persists only the mode/language key; `merge` recalculates derived state on rehydration.
- **Language detection**: on first visit (no `popcorn-lang-init` flag), browser language is detected via `navigator.language`. Stored in Zustand + synced to i18n via `onRehydrateStorage`.
- **SSR / hydration**: features that use i18n or theme are loaded with `dynamic(..., { ssr: false })` to avoid server/client text mismatches. Pages that can't do this use a `mounted` guard.
- **Middleware**: skips all `/api/*` routes. Redirects unauthenticated users to `/login`; redirects authenticated users away from auth routes to `/dashboard`.
- **PWA**: manifest + favicons configured in root layout.

## UI Design System

Design tokens live in `src/styles/`:
- `theme/colors.ts` — full color palette (`gray`, `red`, `yellow`, `green`, `cream`, `brown`)
- `typography.ts` — text variants: `title`, `subtitle`, `body`, `small`, `caption` (size + weight + line-height)
- `theme/light.ts` + `theme/dark.ts` — semantic tokens mapped from the palette

**Rules — violations are bugs, not style preferences:**
- **No hex/rgb values in JSX or CSS** — use design system tokens only
- **No manual `font-size`, `font-weight`, `line-height` in components** — use `typography.ts` variants
- **Tailwind utility classes** for all layout, spacing, and static styles
- **Inline `style={{}}`** only for values computed at runtime (e.g., `top: tooltipY`, JS-driven animation values) — never for colors, typography, or static spacing
- **No CSS Modules, styled-components, or CSS-in-JS**
- **Target aesthetic**: SaaS-style — clean, minimal, easy to scan (Stripe / Linear / Notion)

## Conventions

- New features go in `src/features/`
- External API clients go in `src/services/`
- Route Handlers go in `src/app/api/` and must stay thin
- Reusable UI primitives go in `src/components/ui/`
- Layout wrappers go in `src/components/layouts/`
- Shared non-UI components go in `src/components/common/`
- Constants are split by domain in `src/config/`
- API responses always return `{ code: string }`, never hardcoded messages
- Follow the client provider pattern for global state
- User-facing strings always via `t()` — add keys to both `en.json` and `es.json`

## Git Workflow

Branch flow: `feature → dev → main`

- Feature branches are always created from `dev`
- When a PR is approved and working, merge into `dev`
- After merging to `dev`, merge `dev` into `main` to keep it stable
- `dev` is always the active base branch for development
- Feature branches are deleted once merged into `dev`
- `main` is always stable and production-ready
- **All merges and branch deletions require explicit user authorization — never execute the flow autonomously**
