# Popcorn

Personal movie & series dashboard built with Next.js. Movies feature complete, series in progress.

## Stack

- **Next.js 16** + React 19 (App Router)
- **TypeScript 5** — path alias `@/*` → `src/*`
- **Tailwind CSS 4** + PostCSS
- **Zustand 5** — global state with localStorage persistence
- **i18next** + react-i18next — ES/EN internationalization
- **jose** — JWT utilities (Edge Runtime compatible)
- **clsx** — conditional class merging
- **ESLint 9** + Prettier — no semicolons, single quotes
- **Jest 30** + Testing Library — unit & integration tests

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
│   ├── movies/page.tsx             # Movies page (ssr: false via dynamic import)
│   ├── series/page.tsx             # Series page (ssr: false via dynamic import)
│   ├── dashboard/page.tsx          # Dashboard placeholder
│   └── page.tsx                    # → redirects to /movies
├── components/
│   ├── common/                     # FiltersPanel, MoviePoster, MetaRow, Sidebar, Topbar, SettingsModal
│   ├── layouts/                    # AuthLayout, DashboardLayout
│   └── ui/                         # Button, Input, Text (polymorphic), Modal, Header, AccordionList, Table/
├── config/                         # App constants split by domain
│   ├── constants.ts                # DEFAULT_LANGUAGE
│   ├── i18n.ts                     # i18next config
│   ├── auth.ts                     # TOKEN_MAX_TIME, REFRESH_TOKEN_MAX_TIME
│   └── tmdb.ts                     # TMDB_LANGUAGE mapping (en/es → TMDB locale codes)
├── features/
│   ├── auth/login/                 # LoginFeature, LoginForm, useLogin, login.service.ts
│   ├── dashboard/                  # Placeholder — not yet implemented
│   ├── movies/                     # MoviesFeature, useMovies, useMovieDetail, useCollectionDetail
│   │                               # MovieDetailModal, CollectionAccordion, MovieMetaGrid
│   │                               # movies.service.ts, movieFilters.schema.ts, MovieDetailSkeleton
│   └── series/                     # SeriesFeature (coming soon placeholder)
├── hooks/                          # useAsync (generic), useFilters, useTranslation
├── locales/                        # en.json, es.json
├── middleware.ts                   # Route protection — skips /api/*, redirects based on token cookie
├── providers/                      # GlobalProvider, ThemeProvider, LanguageProvider (client)
├── services/
│   ├── auth/                       # DummyJSON client — login(), refresh(); config.ts
│   └── tmdb/                       # TMDB client — movies, series, search; client.ts; config.ts
├── store/                          # themeStore, languageStore (Zustand + persist)
├── styles/
│   ├── theme/                      # resolveTheme.ts (auto mode logic), types.ts
│   └── globals.css                 # Tailwind @theme tokens, semantic light/dark CSS vars
├── types/                          # tmdb.ts, movie.ts, table.ts, languageTypes.ts
└── utils/
    ├── tmdb.ts                     # getTMDBImageUrl(path, size)
    ├── getMovieUI.ts               # isUpcoming + releaseYear from TMDBMovieDetail
    └── updateFilterValue.ts        # immutable filter key update helper
```

## Current State

| Area | Status |
|---|---|
| Theme system (light/dark/auto) | Done |
| Internationalization (ES/EN) | Done |
| Auth service (login/logout/refresh) | Done |
| Route protection (middleware) | Done |
| TMDB service (movies/series/search) | Done |
| Login UI | Done |
| Movies page (list, filters, detail modal, sagas) | Done |
| Unit & integration tests (Jest) | Done |
| Dashboard UI | Not started |
| Series page | Not started |

## Architecture Decisions

- **API separation**: `src/app/api/` holds Route Handlers; `src/services/` holds all external API clients. Route Handlers are thin — business logic lives in services.
- **Auth**: Two HttpOnly cookies — `token` (1h) and `refresh_token` (7d). Set on login, both cleared on logout or failed refresh. Protected routes handled in `middleware.ts`.
- **Auth provider**: DummyJSON (`dummyjson.com/auth`) for login/refresh. Login field accepts username (not email) — DummyJSON's `/auth/login` expects a `username` field. Test credentials: `emilys` / `emilyspass`.
- **TMDB**: Strictly a data provider (movies/series/search). Never used for user authentication.
- **Movie filters**: title filter uses `/search/movie` so TMDB pagination reflects real matches; rating/year use `/discover/movie` params. `vote_average_gte` is applied client-side only in search mode (TMDB search doesn't support it). Language is fixed to `en|es` via `with_original_language`.
- **Error codes**: API responses return `{ code: string }` — never hardcoded text. Frontend translates via i18next (`auth.errors.*`, `tmdb.errors.*`).
- **Auto theme**: resolves light (7am–7pm) vs dark based on time of day — see `resolveTheme.ts`.
- **Theme**: applied via CSS custom properties on `[data-theme]` attribute set by `ThemeProvider`. Tailwind utility classes read these vars.
- **State**: separate Zustand stores per domain (theme, language). `partialize` persists only the mode/language key; `merge` recalculates derived state on rehydration.
- **Language detection**: on first visit (no `popcorn-lang-init` flag), browser language is detected via `navigator.language`. Stored in Zustand + synced to i18n via `onRehydrateStorage`.
- **SSR / hydration**: features that use i18n or theme are loaded with `dynamic(..., { ssr: false })` to avoid server/client text mismatches.
- **Middleware**: skips all `/api/*` routes. Redirects unauthenticated users to `/login`; redirects authenticated users away from auth routes to `/movies`.
- **useAsync**: generic hook `useAsync<T>(fetcher, deps)` centralises loading/error/data state for all data-fetching hooks. `fetcher` returning `null` skips the fetch (conditional fetches).
- **PWA**: manifest + favicons configured in root layout.

## UI Design System

Design tokens live in `src/styles/globals.css` and `src/styles/theme/`:
- CSS custom properties define the full palette and semantic tokens for light and dark modes
- `typography.ts` — text variants: `title`, `subtitle`, `body`, `small`, `caption`

**Rules — violations are bugs, not style preferences:**
- **No hex/rgb values in JSX or CSS** — use design system tokens only
- **No manual `font-size`, `font-weight`, `line-height` in components** — use `<Text variant="...">` or Tailwind typography classes that map to the scale
- **Tailwind utility classes** for all layout, spacing, and static styles
- **Inline `style={{}}`** only for values computed at runtime (e.g., `top: tooltipY`, JS-driven animation values) — never for colors, typography, or static spacing
- **No CSS Modules, styled-components, or CSS-in-JS**
- **Target aesthetic**: SaaS-style — clean, minimal, easy to scan (Stripe / Linear / Notion)

## Testing

Tests are co-located with source files (`*.test.ts` / `*.test.tsx`).

```bash
npm test            # run all tests
npm run test:watch  # watch mode
```

Coverage areas:
- **Pure functions**: `getMovieUI`, `updateFilterValue`, `getTMDBImageUrl`, `resolveMode`
- **Business logic**: `applyClientFilters`, `tmdbFetch` error mapping
- **Hooks**: `useAsync` (state machine, cancellation), `useMovieDetail` (conditional fetch)
- **Components**: `Button`, `Modal`, `FiltersPanel` (interactions, badge count)

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
- Tests co-located with source files — `*.test.ts` / `*.test.tsx`

## Git Workflow

Branch flow: `feature → dev → main`

- Feature branches are always created from `dev`
- **Before opening a PR**: `npm test`, `npx tsc --noEmit` and `npm run lint` must all pass
- When a PR is approved, merge into `dev`
- After merging to `dev`: run build-check (`test + tsc + lint`). Only if all pass, merge `dev` into `main`
- `dev` is always the active base branch for development
- Feature branches are deleted once merged into `dev`
- `main` is always stable and production-ready
- **All merges and branch deletions require explicit user authorization — never execute the flow autonomously**
