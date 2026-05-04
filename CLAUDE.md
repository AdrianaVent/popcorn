# Popcorn

Personal movie & series dashboard built with Next.js.

## Stack

- **Next.js 16** + React 19 (App Router)
- **TypeScript 5** — path alias `@/*` → `src/*`
- **Tailwind CSS 4** + PostCSS
- **Zustand 5** — global state with localStorage persistence
- **i18next** + react-i18next — ES/EN internationalization
- **jose** — JWT signing & verification (Edge Runtime compatible)
- **better-sqlite3** — local SQLite database for user management
- **bcryptjs** — password hashing
- **clsx** — conditional class merging
- **ESLint 9** + Prettier — no semicolons, single quotes
- **Jest 30** + Testing Library — unit & integration tests
- **Cypress 15** — end-to-end tests (auth, movies, user management)

---

## Project Structure

```
src/
├── app/
│   ├── api/auth/
│   │   ├── login/              # POST — validates credentials, signs JWT, sets cookies
│   │   ├── logout/             # POST — clears token + refresh_token cookies
│   │   └── refresh/            # POST — verifies refresh JWT, re-signs both tokens
│   ├── api/users/              # GET · POST · DELETE (bulk) — list, create, bulk delete
│   │   └── [id]/               # PATCH · DELETE — update, delete single user
│   ├── login/page.tsx          # ssr: false (i18n)
│   ├── movies/page.tsx         # ssr: false (i18n)
│   ├── series/page.tsx         # ssr: false (i18n)
│   ├── users/page.tsx          # ssr: false — admin only, middleware redirects guests
│   ├── dashboard/page.tsx      # placeholder
│   └── page.tsx                # → redirects to /movies
├── components/
│   ├── common/                 # FiltersPanel, MetaRow, Sidebar, Topbar, SettingsModal, ExportButton
│   ├── layouts/                # AuthLayout, DashboardLayout
│   └── ui/                     # Button, Input, Text (polymorphic), Modal, ModalFooter,
│                               # Header, AccordionList, Table/, LoadingOverlay,
│                               # DatePicker, ConfirmModal, IconButton,
│                               # Toast/ToastItem, Toast/ToastContainer
├── config/
│   ├── auth.ts                 # TOKEN_MAX_TIME, REFRESH_TOKEN_MAX_TIME, JWT_SECRET
│   ├── constants.ts            # DEFAULT_LANGUAGE, ALLOWED_ORIGINAL_LANGUAGES
│   ├── i18n.ts                 # i18next setup
│   └── tmdb.ts                 # TMDB_LANGUAGE map (en/es → TMDB locale codes)
├── db/
│   ├── client.ts               # SQLite singleton — opens DB, runs schema migration on import
│   └── users.ts                # DbUser, UserRole types; findByUsername, findById, create
├── features/
│   ├── auth/login/             # LoginFeature, LoginForm, useLogin, login.service.ts
│   ├── dashboard/              # placeholder
│   ├── movies/
│   │   ├── components/         # MovieDetailModal, MovieDetailSkeleton, MovieMetaGrid,
│   │   │                       # CollectionAccordion, MediaPoster
│   │   ├── hooks/              # useMovies, useMovieDetail, useCollectionDetail
│   │   ├── MoviesFeature.tsx
│   │   ├── movies.service.ts   # fetchMovies, fetchMovieDetail, fetchCollectionDetail
│   │   ├── movieFilters.schema.ts
│   │   ├── getMovieUI.ts       # isUpcoming + releaseYear helpers
│   │   └── index.ts
│   ├── series/
│   │   ├── components/         # SeriesDetailModal, SeriesDetailSkeleton, SeriesMetaGrid,
│   │   │                       # SeasonsAccordion
│   │   ├── hooks/              # useSeries, useSeriesDetail
│   │   ├── SeriesFeature.tsx
│   │   ├── series.service.ts   # fetchSeries, fetchSeriesDetail, fetchSeasonDetail
│   │   ├── seriesFilters.schema.ts
│   │   ├── getSeriesUI.ts      # status badge config from TMDB status string
│   │   └── index.ts
│   └── users/                  # UsersFeature, UserFormModal, users.service.ts,
│                               # userFilters.schema.ts, applyUserFilters.ts, index.ts
├── hooks/
│   ├── useAsync.ts             # generic loading/error/data hook; null fetcher = skip
│   └── useFilters.ts
├── locales/                    # en.json, es.json
├── middleware.ts               # JWT verification + route protection (Edge Runtime)
├── providers/                  # GlobalProvider, ThemeProvider, LanguageProvider
├── services/
│   ├── auth/index.ts           # authService.login (bcrypt + sign), authService.refresh (verify + re-sign)
│   │   └── requireAdmin.ts     # Route Handler guard — verifies JWT + asserts admin role
│   └── tmdb/                   # tmdbFetch, movies, series, search clients
├── store/
│   ├── themeStore.ts           # light / dark / auto
│   ├── languageStore.ts        # en / es
│   ├── userStore.ts            # userId (string) + role ('admin' | 'guest')
│   ├── watchedStore.ts         # per-user movies Map, episodes Map, seriesData Map (v3)
│   └── toastStore.ts           # transient toast queue — addToast(type, message) / removeToast(id)
├── styles/
│   ├── theme/                  # resolveTheme.ts (auto = time-of-day), types.ts
│   └── globals.css             # Tailwind @theme tokens + semantic light/dark CSS vars
│                               # palette: gray, red, yellow, green, burgundy, cream, blue
├── types/                      # tmdb.ts, movie.ts, series.ts, table.ts, languageTypes.ts
└── utils/
    ├── exportData.ts           # toCSV, exportAsJSON, exportAsCSV
    ├── formatDate.ts           # formatShortDate(dateStr, language) → "dd mon yyyy"
    ├── formatNumber.ts         # formatVoteCount(n, language) — regex-based thousands separator
    ├── getTMDBImageUrl.ts
    └── updateFilterValue.ts    # immutable filter key update
scripts/
└── seed.ts                     # npm run seed [username] [password] — creates admin user
data/
└── popcorn.db                  # SQLite DB — gitignored, auto-created on first run
```

---

## Current State

| Area | Status |
|---|---|
| Theme system (light / dark / auto) | Done |
| Internationalization (ES / EN) | Done |
| Auth — self-hosted (SQLite + bcrypt + JWT) | Done |
| Role system (admin / guest) | Done |
| Route protection (middleware + JWT verification) | Done |
| TMDB service (movies / series / search) | Done |
| Login UI | Done |
| Movies (list, filters, detail modal, sagas) | Done |
| Series (list, filters, detail modal, seasons/episodes) | Done |
| Watched tracking (movies + episodes, per-user) | Done |
| Export JSON + CSV (movies + series, admin only) | Done |
| Unit & integration tests | Done |
| User management UI | Done |
| User management — pagination + toasts | Done |
| E2E tests (Cypress) | Done |
| Dashboard UI | Not started |

---

## Architecture Decisions

**Auth — self-hosted**
No external auth provider. Users in `data/popcorn.db` (gitignored, created on first run). Passwords hashed with bcrypt (cost 10). JWTs signed with `jose` using `JWT_SECRET` from env. Access token payload: `{ sub: userId, username, role }`. Refresh token payload: `{ sub: userId }`. Role is readable server-side without a DB roundtrip.

**Roles**
`admin` — full access. `guest` — browse + mark watched; no export, no user management. ExportButton is conditionally rendered based on `role` from `userStore`.

**Sessions**
Two HttpOnly cookies: `token` (1h) + `refresh_token` (7d). Set on login, both cleared on logout or failed refresh. Refresh verifies the refresh JWT, looks up the user in the DB, and re-signs both tokens.

**Middleware**
Verifies JWT with `jwtVerify` (Edge Runtime — no DB call). Invalid or expired token clears both cookies and redirects to `/login`. Skips all `/api/*` routes.

**Seed script**
`scripts/seed.ts` imports `usersDb` from `src/db/users`. `client.ts` initializes the DB and schema on import — no duplication. Run with `npm run seed [username] [password]`. Password requirements: ≥8 chars, 1 uppercase, 1 number, 1 special character.

**TMDB**
Read-only data provider (movies/series/search). Never used for authentication. API key is `NEXT_PUBLIC_` (client-visible) — acceptable for a personal read-only project.

**Movie filters**
Title filter uses `/search/movie` so TMDB pagination reflects real matches. Rating/year use `/discover/movie` params. `vote_average_gte` applied client-side only in search mode (TMDB search doesn't support it). Language fixed to `en|es` via `with_original_language` (and `ALLOWED_ORIGINAL_LANGUAGES` client-side when search is active).

**Export**
`exportAsJSON` and `exportAsCSV` in `src/utils/exportData.ts`. Export fetches all pages before downloading. CSV uses `formatShortDate` and `formatVoteCount` for display formatting. JSON uses raw TMDB values. Only visible to `admin`.

**Vote count formatting**
`formatVoteCount` uses a regex (`/\B(?=(\d{3})+(?!\d))/g`) instead of `toLocaleString` — Node.js without full ICU data makes `toLocaleString` unreliable across environments.

**API separation**
Route Handlers in `src/app/api/` are thin (HTTP in/out only). Business logic lives in `src/services/`. All API responses return `{ code: string }` — never hardcoded text. Frontend translates via i18next (`auth.errors.*`, `tmdb.errors.*`).

**Auto theme**
Resolves light (7am–7pm) vs dark based on time of day — `resolveTheme.ts`. Applied via CSS custom properties on `[data-theme]` attribute set by `ThemeProvider`.

**State**
Separate Zustand stores per domain. `partialize` persists only the key field; `merge` recalculates derived state on rehydration. Language detected from `navigator.language` on first visit (no `popcorn-lang-init` flag), then stored in Zustand + synced to i18n via `onRehydrateStorage`.

**SSR / hydration**
Features using i18n or theme loaded with `dynamic(..., { ssr: false })` to avoid server/client mismatches.

**useAsync**
`useAsync<T>(fetcher, deps)` centralises loading/error/data state. `fetcher` returning `null` skips the fetch — used for conditional data loading.

**Watched store (v3)**
Per-user state keyed by `userId`. Movies stored as `StoredMovie` snapshots. Episodes stored as `Record<episodeId, { seasonNumber }>` — `seasonNumber` enables per-season counts without fetching episode lists. Series stored as `StoredSeries` on first episode mark. `filters.watched === 'watched'` bypasses TMDB entirely and serves local data with local pagination.

**Series background enrichment**
`SeriesFeature` runs `Promise.allSettled` after the list loads to fetch `status` and `number_of_episodes` per series. Cancelled via `AbortController` on cleanup. Results stored in `Map<id, value>` component state — not in Zustand.

---

## UI Design System

Tokens in `src/styles/globals.css` and `src/styles/theme/`. CSS custom properties define the full palette for light and dark modes. `typography.ts` defines text variants: `title`, `subtitle`, `body`, `small`, `caption`.

**Rules — violations are bugs:**
- No hex/rgb values in JSX or CSS — use design system tokens only
- No manual `font-size`, `font-weight`, `line-height` — use `<Text variant="...">` or Tailwind scale classes
- Tailwind utility classes for all layout, spacing and static styles
- Inline `style={{}}` only for runtime-computed values (positions, dynamic heights) — never for colors or typography
- No CSS Modules, styled-components or CSS-in-JS
- Target aesthetic: SaaS-style — clean, minimal, easy to scan (Stripe / Linear / Notion)

---

## Testing

### Unit & integration (Jest)

Co-located with source files (`*.test.ts` / `*.test.tsx`).

```bash
npm test            # run all tests
npm run test:watch  # watch mode
```

| Area | What's covered |
|---|---|
| Pure functions | `getMovieUI`, `getSeriesUI`, `updateFilterValue`, `getTMDBImageUrl`, `resolveMode`, `formatVoteCount`, `formatShortDate` |
| Business logic | `applyClientFilters` (movies + series + language filter), `applyUserFilters` (username, role, date, creator), `tmdbFetch` error mapping, `toCSV` (headers, quoting, empty rows) |
| Store | `watchedStore` — `toggleMovie`, `toggleEpisode` (seasonNumber), per-season count derivation; `toastStore` — addToast, timers, removeToast |
| Hooks | `useAsync` (state machine, cancellation), `useMovieDetail`, `useSeriesDetail` (conditional fetch) |
| Components | `Button`, `Modal`, `FiltersPanel`, `SeriesMetaGrid`, `ExportButton`, `ConfirmModal`, `UserFormModal`, `ToastItem` |

### E2E (Cypress)

Tests live in `cypress/e2e/`. Requires the dev server running on port 3000.

```bash
npm run dev          # terminal 1
npm run cypress      # terminal 2 — opens Cypress UI
npm run cypress:run  # headless run
```

Cypress uses `cy.task('seedUser')` / `cy.task('deleteUser')` to manage test users directly in the SQLite DB. TMDB calls are intercepted with `cy.intercept`.

| Suite | What's covered |
|---|---|
| `auth.cy.ts` | Redirect when unauthenticated, invalid credentials error, successful login, logout |
| `movies.cy.ts` | Movie list renders (mocked TMDB), detail modal opens on row click |
| `users.cy.ts` | List, create + toast, edit + toast, delete + toast, bulk delete + toast |

---

## Conventions

- Features → `src/features/` · API clients → `src/services/` · Route Handlers → `src/app/api/` (thin)
- UI primitives → `src/components/ui/` · layouts → `src/components/layouts/` · shared → `src/components/common/`
- Constants split by domain in `src/config/`
- API responses always `{ code: string }` — never hardcoded messages
- User-facing strings always via `t()` — add keys to both `en.json` and `es.json`
- **Import paths**: `@/` for any cross-directory import; `./` within the same folder. Never `../`
- Tests co-located — `*.test.ts` / `*.test.tsx`
- No comments unless the WHY is non-obvious

---

## Git Workflow

Branch flow: `feature → dev → main`

- Feature branches always cut from `dev`
- Before a PR: `npm test` + `npx tsc --noEmit` + `npm run lint` must all pass
- Merge feature PR into `dev` → run build-check → only then merge `dev` into `main`
- `main` is always stable and production-ready
- **All merges and branch deletions require explicit user authorization**
