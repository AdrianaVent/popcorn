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
- **TanStack Query 5** (`@tanstack/react-query`) — server-state management, caching, background refetch
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
│   │   ├── [id]/               # PATCH · DELETE — update, delete single user
│   │   └── import/             # POST — bulk create from parsed JSON/CSV rows; returns { created, failed[] }
│   ├── login/page.tsx          # ssr: false (i18n)
│   ├── movies/page.tsx         # ssr: false (i18n)
│   ├── series/page.tsx         # ssr: false (i18n)
│   ├── users/page.tsx          # ssr: false — admin only, middleware redirects guests
│   ├── dashboard/page.tsx      # placeholder
│   └── page.tsx                # → redirects to /movies
├── components/
│   ├── common/                 # FiltersPanel, MetaRow, Sidebar, Topbar, SettingsModal, ExportButton,
│   │                           # ImportModal (generic file upload → results), WatchProviders, ErrorBoundary
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
│   │   ├── hooks/              # useMovies, useMovieDetail, useCollectionDetail,
│   │   │                       # useMovieWatchProviders, useMovieInTheaters
│   │   ├── MoviesFeature.tsx
│   │   ├── movies.service.ts   # fetchMovies, fetchMovieDetail, fetchCollectionDetail,
│   │   │                       # fetchMovieWatchProviders, fetchMovieWatchProviderOptions
│   │   ├── movieFilters.schema.ts
│   │   ├── getMovieUI.ts       # isUpcoming + releaseYear helpers
│   │   └── index.ts
│   ├── series/
│   │   ├── components/         # SeriesDetailModal, SeriesDetailSkeleton, SeriesMetaGrid,
│   │   │                       # SeasonsAccordion
│   │   ├── hooks/              # useSeries, useSeriesDetail, useSeriesWatchProviders
│   │   ├── SeriesFeature.tsx
│   │   ├── series.service.ts   # fetchSeries, fetchSeriesDetail, fetchSeasonDetail,
│   │   │                       # fetchSeriesWatchProviders, fetchSeriesWatchProviderOptions
│   │   ├── seriesFilters.schema.ts
│   │   ├── getSeriesUI.ts      # status badge config from TMDB status string
│   │   └── index.ts
│   └── users/                  # UsersFeature, UserFormModal, ImportUsersModal,
│                               # users.service.ts, userFilters.schema.ts, applyUserFilters.ts, index.ts
├── hooks/
│   ├── useFilters.ts
│   └── useWatchProviders.ts    # generic hook — fetches + deduplicates flatrate/rent/buy per region (TanStack Query)
├── locales/                    # en.json, es.json
├── middleware.ts               # JWT verification + route protection (Edge Runtime)
├── providers/                  # GlobalProvider, ThemeProvider, LanguageProvider
├── services/
│   ├── apiFetch.ts             # apiFetch wrapper — auto-refresh on 401, redirect to /login on failure
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
    ├── updateFilterValue.ts    # immutable filter key update
    └── watchProviders.ts       # deduplicateProviders — prefix-based variant removal
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
| Watch providers (Spain) — modal + platform filter | Done |
| Export users (JSON + CSV, admin only) | Done |
| Import users — bulk create from JSON/CSV (admin only) | Done |
| Session auto-refresh + redirect on expiry | Done |
| TanStack Query migration (server-state caching) | Done |
| Error boundaries (movies, series, users) | Done |
| CI pipeline (GitHub Actions — tsc, lint, jest, build) | Done |
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

**TanStack Query (server state)**
All TMDB data fetching and the users list use `useQuery` from `@tanstack/react-query`. `QueryClientProvider` wraps the entire app in `GlobalProvider`. Default `staleTime: 5min` avoids redundant refetches for TMDB data. `enabled: id !== null` replaces the old null-fetcher pattern. Query keys are structured arrays (`['movie-detail', id, language]`) so language changes automatically invalidate cached data. The `useAsync` custom hook has been removed. Hook tests wrap `renderHook` in a `QueryClientProvider` with `retry: false` for deterministic test behavior. `useWatchProviders` accepts a `type: 'movie' | 'series'` parameter so movie and series provider queries get distinct cache entries despite sharing the same generic hook. User mutations (create, update, delete, bulk delete) use `useMutation`: `onSuccess` invalidates the `['users']` cache and queues the toast via `pendingToast` (fires on modal close); `onError` shows a toast for all errors except `USERNAME_TAKEN`, which is re-thrown to the form for inline display. Delete loading state is derived from `deleteOneMutation.isPending || deleteManyMutation.isPending`.

**Error boundaries**
`ErrorBoundary` in `src/components/common/` is a React class component wrapping a functional `ErrorFallback` (needed because hooks cannot be used in class components). Wraps `MoviesPage`, `SeriesPage`, and `UsersPage`. On error, renders a translated message with a reset button that clears the error state and remounts the children.

**CI pipeline**
`.github/workflows/ci.yml` runs on every push and on PRs targeting `dev` or `main`. Runs on Node 24. Steps: install (`npm ci`), type check (`npx tsc --noEmit`), lint (`npm run lint`), tests (`npm test`), build (`npm run build`). The build step uses `NEXT_PUBLIC_TMDB_API_KEY` and `JWT_SECRET` from GitHub repository secrets if configured; both fall back to placeholder values so CI passes even without secrets set. `jest.config.ts` is TypeScript and requires `ts-node` (in devDependencies) to be parsed by Jest. Cypress E2E runs locally only — it requires a live dev server and a seeded DB.

**Watched store (v3)**
Per-user state keyed by `userId`. Movies stored as `StoredMovie` snapshots. Episodes stored as `Record<episodeId, { seasonNumber }>` — `seasonNumber` enables per-season counts without fetching episode lists. Series stored as `StoredSeries` on first episode mark. `filters.watched === 'watched'` bypasses TMDB entirely and serves local data with local pagination.

**Series background enrichment**
`SeriesFeature` runs `Promise.allSettled` after the list loads to fetch `status` and `number_of_episodes` per series. Cancelled via `AbortController` on cleanup. Results stored in `Map<id, value>` component state — not in Zustand.

**Watch providers**
Region hardcoded to `ES` (`WATCH_PROVIDERS_REGION` constant). `useWatchProviders(id, fetcher)` is a generic hook used by both `useMovieWatchProviders` and `useSeriesWatchProviders`. Flatrate providers are sorted by `display_priority` and name-deduplicated via `deduplicateProviders` (generic, preserves subtypes). Rent and buy are merged into a single paid list tagged with `source: 'rent' | 'buy'`; rent takes precedence when a provider appears in both. Paid list is also deduplicated by `provider_id` first, then by name, and capped at 3. "In theaters" is detected via `/movie/{id}/release_dates` for ES — only type 3 (Theatrical) releases within the last 90 days qualify. Badge color uses `bg-primary` (burgundy in light, yellow in dark). Future: multi-country support via user preference.

**Import (bulk create)**
`ImportModal` in `src/components/common/` is fully generic: accepts an `onProcess(rows)` callback and renders the two-phase UI (upload → results) independently of the entity type. Thin wrappers (e.g. `ImportUsersModal`) wire the domain-specific API call and i18n strings. Required fields: `username`, `password`, `role`. Optional fields: `created_by` (admin username — defaults to the importing admin) and `created_at` (ISO date, today or earlier — defaults to current timestamp). CSV parser handles passwords with commas for any number of columns: it assumes `password` is always the second column and excess split parts are re-joined into it, with trailing columns consumed from the end. Password requirements for bulk import are validated server-side at `/api/users/import` using the same `PASSWORD_REGEX` as the single-user form (`^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$`). Failed rows are returned as `{ index, username, code }` and can be downloaded as CSV. Each row is processed independently — valid rows are created even if other rows fail. Intra-file duplicate usernames: first occurrence is created, subsequent ones get `IMPORT_USERNAME_DUPLICATE`.

**Session auto-refresh**
`apiFetch` in `src/services/apiFetch.ts` wraps all user-management API calls. On 401: attempts `/api/auth/refresh` (POST); if successful, retries original request; if refresh fails, calls `redirectToLogin()` which calls `window.location.replace('/login')` and throws `SESSION_EXPIRED`. `users.service.ts` uses `apiFetch` instead of bare `fetch`.

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
| Pure functions | `getMovieUI`, `getSeriesUI`, `updateFilterValue`, `getTMDBImageUrl`, `resolveMode`, `formatVoteCount`, `formatShortDate`, `deduplicateProviders` (generic, subtype preservation) |
| Business logic | `applyClientFilters` (movies + series + language filter), `applyUserFilters` (username, role, date, creator), `tmdbFetch` error mapping, `toCSV` (headers, quoting, empty rows) |
| Store | `watchedStore` — `toggleMovie`, `toggleEpisode` (seasonNumber), per-season count derivation; `toastStore` — addToast, timers, removeToast |
| Hooks | `useMovieDetail`, `useSeriesDetail` (conditional fetch via `enabled`), `useWatchProviders` (flatrate/rent/buy merge, dedup, source tagging, loading), `useMovieInTheaters` (type 3 release, 90-day window) — all wrapped in `QueryClientProvider` with `retry: false` |
| Components | `Button`, `Modal`, `FiltersPanel`, `SeriesMetaGrid`, `ExportButton`, `ConfirmModal`, `UserFormModal`, `ToastItem`, `WatchProviders` (loading skeleton, badges, inTheaters chip), `ErrorBoundary` (children render, fallback on error, retry reset) |
| Services | `apiFetch` (401 auto-refresh, redirect on session expiry) |
| API routes | `/api/users/import` (per-row validation: missing fields, invalid role/password, intra-file duplicate, DB duplicate, invalid creator, invalid date) |

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
| `auth.cy.ts` | Redirect when unauthenticated, invalid credentials error, successful login, logout, guest redirect from /users |
| `movies.cy.ts` | Movie list, detail modal, watch providers section, platform filter, access control (guest) |
| `series.cy.ts` | Series list, detail modal, watch providers section, platform filter |
| `users.cy.ts` | List, create + toast, edit + toast, delete + toast, bulk delete + toast, self-protection, filters, import JSON + CSV, partial import failures, post-import cleanup |
| `settings.cy.ts` | Theme switching (light / dark), language switching (EN / ES) |

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
