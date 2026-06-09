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
│   ├── (dashboard)/            # persistent layout group (Sidebar never unmounts)
│   │   ├── layout.tsx          # server layout — decodes JWT cookie, passes role to client layout
│   │   ├── DashboardGroupLayoutClient.tsx  # 'use client' — pathname → activeNav, logout, provides DashboardRoleContext
│   │   ├── DashboardRoleContext.tsx        # React context exposing serverRole to client subtree (loading skeletons)
│   │   ├── movies/             # page.tsx + loading.tsx (6 skeleton cols — poster, title, genres, rating, release, runtime)
│   │   ├── series/             # page.tsx + loading.tsx (7 skeleton cols — poster, title, status, genres, rating, first_air_date, runtime)
│   │   ├── my-list/            # page.tsx + loading.tsx (guest only)
│   │   ├── users/              # page.tsx + loading.tsx (admin only)
│   │   └── home/               # page.tsx + loading.tsx — genre dashboard
│   ├── login/page.tsx          # ssr: false (i18n)
│   └── page.tsx                # → redirects to /home
├── components/
│   ├── common/                 # FiltersPanel, MetaRow, Sidebar, SettingsModal, ExportButton,
│   │                           # ImportModal (generic file upload → results), WatchProviders, ErrorBoundary,
│   │                           # MediaDetailSkeleton (shared modal loading state),
│   │                           # MediaPoster (poster image with FilmIcon fallback; loading prop: 'lazy' | 'eager')
│   ├── layouts/                # AuthLayout, DashboardLayout,
│   │                           # PageLayout (shared h-full flex-col wrapper + Header; start/end slots)
│   └── ui/                     # Button, Input, Text (polymorphic), Modal, ModalFooter,
│                               # Header, AccordionList, Table/, TableSkeleton, LoadingOverlay,
│                               # DatePicker, ConfirmModal, IconButton,
│                               # Toast/ToastItem, Toast/ToastContainer,
│                               # BarChart (Recharts wrapper), DonutChart (Recharts pie with compact legend),
│                               # ContentTabToggle (icon-button tab switcher — film/tv),
│                               # GenreGrid (genre badge list with icon + name deduplication),
│                               # MultiSelectChips (portal-based genre multi-select dropdown),
│                               # SearchableSelect (portal-based single-select with search input),
│                               # YearRangePicker (two SearchableSelects cross-filtering each other),
│                               # FilterFieldInput (generic field renderer — dispatches on FilterFieldType;
│                               #   NumberWithUnitsInput sub-component handles d/h/min conversion for runtime fields),
│                               # ToggleSwitch, PageSkeleton,
│                               # StarRating (5-star, half-star; value: 0.5–5 | null),
│                               # Tooltip (portal-based, 150ms delay, placement: top/right/bottom/left),
│                               # TrailerPlayer (YouTube iframe embed; optional onClose × button),
│                               # IconToggleButton (28×28px icon button with active/inactive toggle state — used for trailer + watchlist buttons),
│                               # donutColors.ts (COLORS_LIGHT / COLORS_DARK / COLORS_HC — interleaved hue palettes for DonutChart)
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
│   ├── home/                   # HomeFeature — genre donut charts + Top10 cards + release calendar
│   │   ├── components/         # ReleaseCalendar (month grid, dots on release days, navigation),
│   │   │                       # CalendarGrid (weekday headers + day cells; owns releaseDays/watchlistDays memos),
│   │   │                       # CalendarReleaseItem (single release entry with trailer, genre icons, status),
│   │   │                       # Top10Card (ranked list with poster, year, genre icons, star rating),
│   │   │                       # GenreDropdown (portal-based genre filter dropdown for Top10Card; owns all dropdown state)
│   │   └── hooks/              # useMovieGenres (user + global), useSeriesGenres (user + global),
│   │                           # buildGenreCounts (shared genre aggregation utility — deduplicates same-named genres per entry),
│   │                           # useMovieReleases, useSeriesReleases (monthly TMDB releases),
│   │                           # useUserMovieTop10, useUserSeriesTop10 (TanStack Query enrichment — backfills genre_ids)
│   ├── movies/
│   │   ├── components/         # MovieDetailModal, MovieMetaGrid,
│   │   │                       # CollectionAccordion (saga list with mark-all toggle),
│   │   │                       # SagaMovieItem (individual saga entry with inline trailer)
│   │   ├── hooks/              # useMovies, useMovieDetail, useCollectionDetail,
│   │   │                       # useMovieInTheaters,
│   │   │                       # useMovieRuntimeEnrichment (Promise.allSettled runtime backfill via AbortController),
│   │   │                       # useMovieColumns (6-column definition; reads role/language/watched stores internally),
│   │   │                       # useMovieExport (export logic + isExporting state; reads stores internally)
│   │   ├── MoviesFeature.tsx
│   │   ├── movies.service.ts   # fetchMovies, fetchMovieDetail, fetchCollectionDetail,
│   │   │                       # fetchMovieWatchProviders, fetchMovieWatchProviderOptions,
│   │   │                       # fetchMovieVideos
│   │   ├── movieFilters.schema.ts
│   │   ├── getMovieUI.ts       # isUpcoming + releaseYear + resolvedDate helpers; resolveSpanishDate picks ES theatrical date (type 2|3) from append_to_response=release_dates
│   │   └── index.ts
│   ├── series/
│   │   ├── components/         # SeriesDetailModal, SeriesMetaGrid,
│   │   │                       # SeasonsAccordion (thin wrapper — delegates to seasons/SeasonItem),
│   │   │                       # seasons/SeasonItem (trailer, mark-season-watched, episode list),
│   │   │                       # seasons/EpisodeRow (episode with watched state + WatchedEpisodeButton),
│   │   │                       # seasons/WatchedEpisodeButton (toggle episode watched)
│   │   ├── hooks/              # useSeries, useSeriesDetail,
│   │   │                       # useSeriesEnrichment (Promise.allSettled status/totals/runtimes/genreIds backfill),
│   │   │                       # useSeriesColumns (7-column definition; reads role/language/watched stores internally),
│   │   │                       # useSeriesExport (export logic + isExporting state; reads stores internally),
│   │   │                       # useSeriesMarkAll (async mark-all seasons logic; date-gated, toggle when all done)
│   │   ├── SeriesFeature.tsx
│   │   ├── series.service.ts   # fetchSeries, fetchSeriesDetail, fetchSeasonDetail,
│   │   │                       # fetchSeriesWatchProviders, fetchSeriesWatchProviderOptions,
│   │   │                       # fetchSeriesVideos, fetchSeasonVideos
│   │   ├── seriesFilters.schema.ts
│   │   ├── getSeriesUI.ts      # status badge config; resolveSeriesGenreName — static ES translation map (TV genre IDs)
│   │   └── index.ts
│   ├── myList/                 # MyListFeature — Movies/Series/Por ver tabs, saga grouping (bin-packing layout), watchedAt ordering, recommendations drawer
│   │   ├── myListUtils.ts      # RATING_THRESHOLD, SagaGroup, WatchlistSagaGroup, RecommendationSource types; formatSagaName;
│   │   │                       # groupAndSortMovies, computeSagasFirst, groupWatchlistMovies, binPackSagas, SAGA_PX, SAGA_GAP
│   │   ├── components/         # MoviesTabPanel (owns filter state, saga grouping, bin-packing layout, collectionResults, scroll effect),
│   │   │                       # SeriesTabPanel (owns filter state, series list, episode counts, scroll effect),
│   │   │                       # WatchlistTabPanel (reads watchlist + watched stores; renders movies + series columns),
│   │   │                       # MovieCard (poster, year, StarRating, always-visible Recommendations button + Tooltip),
│   │   │                       # SeriesCard (ribbon, episode progress, StarRating, always-visible Recommendations button + Tooltip),
│   │   │                       # SagaCard (collection query + bin-packing row; uses full watchedMovies store for watched state),
│   │   │                       # WatchlistSagaCard (3 states: watched/watchlisted/placeholder; date-gated to released parts),
│   │   │                       # UnwatchedMoviePlaceholder (dimmed dashed-border poster for unwatched/upcoming saga entries),
│   │   │                       # RecommendationsDrawer (right-side panel, max 5 items, saga/movie/series source header),
│   │   │                       # WatchlistCard (poster, year, remove heart button — used in Por ver tab)
│   │   └── hooks/              # useMovieRecommendations, useSeriesRecommendations (useQueries per source, ≥3.5★ filter, excludes watched)
│   └── users/                  # UsersFeature, UserFormModal, ImportUsersModal,
│   │                           # users.service.ts (fetchUsers — server-side paginated + filtered),
│   │                           # userFilters.schema.ts, index.ts
│   │   └── hooks/              # useUserColumns (6-column definition; reads language/userStore internally; selection callbacks via params),
│   │                           # useUserExport (fetches all users, exports JSON/CSV; reads language/toastStore internally)
├── hooks/
│   ├── useFilters.ts
│   ├── useMounted.ts           # returns false on server / during hydration, true after mount
│   ├── useTruncated.ts         # ResizeObserver-based truncation detection; generic `<T extends HTMLElement>`; returns { ref, isTruncated }
│   ├── useTrailer.ts           # picks best YouTube trailer (language preference → fallback); staleTime 24h; exports pickYouTubeTrailer, useEnrichedTrailers (YouTube oEmbed title fetch), resolveHeaderTrailer, resolveSeasonFallback, findSeasonTrailerInList, filterNonSeasonTrailers
│   └── useWatchProviders.ts    # generic hook — fetches + deduplicates flatrate/rent/buy per region (TanStack Query)
├── locales/                    # en.json, es.json
├── middleware.ts               # JWT verification + route protection (Edge Runtime)
├── providers/                  # GlobalProvider, ThemeProvider, LanguageProvider
├── services/
│   ├── apiFetch.ts             # apiFetch wrapper — auto-refresh on 401, redirect to /login on failure
│   ├── auth/index.ts           # authService.login (bcrypt + sign), authService.refresh (verify + re-sign)
│   │   └── requireAdmin.ts     # Route Handler guard — verifies JWT + asserts admin role
│   └── tmdb/                   # tmdbFetch, movies, series, search clients,
│                               # releases (monthly movie/series releases — EN/ES filtered, up to 5 pages)
├── store/
│   ├── themeStore.ts           # light / dark / auto
│   ├── languageStore.ts        # en / es
│   ├── userStore.ts            # userId (string) + role ('admin' | 'guest')
│   ├── watchedStore.ts         # per-user movies Map, episodes Map, seriesData Map (v3); StoredMovie includes collection_id/name; auto-removes from watchlist on mark
│   ├── watchlistStore.ts       # per-user watchlist (movies + series); toggleMovie/toggleSeries; removeMovie/removeSeries; persisted as 'popcorn-watchlist-v1'
│   ├── ratingsStore.ts         # per-user movie/series ratings (Rating: 0.5–5); persisted as 'popcorn-ratings-v1'
│   └── toastStore.ts           # transient toast queue — addToast(type, message) / removeToast(id)
├── styles/
│   ├── theme/                  # resolveTheme.ts (auto = time-of-day), types.ts
│   └── globals.css             # Tailwind @theme tokens + semantic light/dark CSS vars
│                               # palette: gray, red, yellow, green, burgundy, cream, blue
├── types/                      # tmdb.ts, movie.ts, series.ts (genre_ids explicit to avoid unknown from index sig),
│                               # table.ts (FilterUnit: { value, label, multiplier } for d/h/min fields), languageTypes.ts
└── utils/
    ├── exportData.ts           # toCSV, exportAsJSON, exportAsCSV
    ├── formatDate.ts           # formatShortDate(dateStr, language) → "dd mon yyyy"
    ├── formatNumber.ts         # formatVoteCount(n, language) — regex-based thousands separator
    ├── getTMDBImageUrl.ts
    ├── importUtils.ts          # parseJSON, parseCSV — shared parsers for ImportModal (CSV handles passwords with commas)
    ├── updateFilterValue.ts    # immutable filter key update
    └── watchProviders.ts       # deduplicateProviders — prefix-based variant removal;
│                               # fetchWatchProviderOptions — shared fetch + dedup logic for movies and series
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
| User management — server-side pagination + toasts | Done |
| E2E tests (Cypress) | Done |
| Watch providers (Spain) — modal + platform filter | Done |
| Export users (JSON + CSV, admin only) | Done |
| Import users — bulk create from JSON/CSV (admin only) | Done |
| Session auto-refresh + redirect on expiry | Done |
| TanStack Query migration (server-state caching) | Done |
| Error boundaries (movies, series, users) | Done |
| CI pipeline (GitHub Actions — tsc, lint, jest, build + Cypress E2E + Docker publish) | Done |
| Docker support (multi-stage Dockerfile, docker-compose, auto-seed on first run) | Done |
| Home (genre bar charts — movies + series, user/global toggle) | Done |
| Persistent dashboard layout + SSR-safe hydration | Done |
| Home release calendar (monthly EN/ES releases, dots per day, movie/series tabs) | Done |
| My list (guest-only: watched movies/series, saga grouping, watchedAt-based section ordering, 5-star ratings) | Done |
| My list recommendations — right-side drawer, max 5 items, ≥ 3.5★ filter, saga name in header, excludes watched | Done |
| My list saga — UnwatchedMoviePlaceholder (dimmed poster + dashed border) for unwatched/upcoming saga movies; parts with a known release_date shown (past and future); undated parts filtered out. CollectionAccordion follows the same rule. | Done |
| My list saga layout — bin-packing algorithm fills horizontal space across rows; single-released-movie collections demoted to standalone; CollectionAccordion hidden when ≤ 1 released part | Done |
| My list scroll-to-card — opening the recommendations drawer centers the selected movie/saga/series card in the scroll container | Done |
| Watchlist (Por ver) — per-user watchlist store; heart button in tables, detail modals, calendar; Por ver tab in My list with two-column layout (movies + series), saga grouping with 3 states (watched/watchlisted/placeholder); count badges on all 3 tabs (circle, 99+ cap, exact tooltip); auto-remove from watchlist on mark watched | Done |
| Watched ribbon on poster in movies/series tables (diagonal "Visto" banner, guest only) | Done |
| Clear-all-filters button in FiltersPanel header | Done |
| Horizontal table scroll on narrow viewports | Done |
| Primary color for all watched indicators (replaces green throughout) | Done |
| Bulk-mark saga/series: date-gated (only past/today releases) + unmark when all done | Done |
| CSV export — UTF-8 BOM for correct accent rendering in Excel/LibreOffice | Done |
| Collection backfill on modal open (enrichMovie) — fixes saga grouping for table-marked movies | Done |
| Loading skeleton (movies: 6 cols, series: 7 cols — fixed, no longer role-dependent) | Done |
| Genre multi-select filter (chips dropdown, portal-based) for movies and series | Done |
| Genre deduplication in detail modals (GenreGrid — deduplicates by resolved name + icon) | Done |
| Home Top10 cards (ranked list with year, genre icons, star rating; movies + series tabs) | Done |
| Top10 genre enrichment for user mode (backfills missing genre_ids via TanStack Query) | Done |
| buildGenreCounts per-entry deduplication (one count per genre name per movie/series) | Done |
| YouTube trailers (movie modal, series modal, seasons accordion, saga accordion, release calendar) | Done |
| Smart season trailer matching — YouTube oEmbed title enrichment; season-specific fallback via "Season X"/"Temporada X" regex; generic trailers filter to series header only | Done |
| UI transition animations (Modal fade+scale, Toast slide-in, dropdowns fade-in, AccordionList height, MyList tab crossfade) | Done |
| Top10 genre dropdown — portal-based (fixes overflow clipping in scrollable containers) | Done |
| Sticky table header — per-`<th>` sticky (fixes poster bleed-through caused by GPU compositing conflict) | Done |
| Component extraction — FilterFieldInput (from FiltersPanel), CalendarReleaseItem (from ReleaseCalendar), seasons/ subfolder (from SeasonsAccordion) | Done |
| Hook extraction — useMovieRuntimeEnrichment (from MoviesFeature), useSeriesEnrichment (from SeriesFeature) | Done |
| Genres column in movies/series tables (icon-only with Tooltip per genre; deduped by icon) | Done |
| Duration filter with d/h/min unit selector (value stored in minutes; pill auto-converts back) | Done |
| Tooltip on truncated titles in movies/series tables (ResizeObserver via useTruncated) | Done |
| Watch provider tooltip clarifies rent (€) and buy (🛒) icons with label | Done |
| TitleCell + GenresCell extracted to MediaTableCells (shared by movies and series) | Done |
| Series genre_ids backfill via enrichment (useSeriesEnrichment now returns genreIds map) | Done |
| Series runtime filter applied client-side on total duration (not TMDB per-episode) | Done |
| Cypress E2E — watched ribbon tests for movies and series (admin/guest/mark/unmark) | Done |
| useSeriesEnrichment unit tests (8 cases; stable-reference pattern for renderHook) | Done |
| Accessibility + high-contrast audit — ARIA roles, aria-hidden on decorative icons, aria-pressed on toggles, role=alert on login messages, keyboard support on CalendarReleaseItem, full date aria-labels on calendar day buttons | Done |
| High-contrast mode (HC) — solid borders + transparent backgrounds on STATUS_MAP badges, provider/theater chips, trailer close button, today/empty hover states, login message boxes, release calendar, Top10Card hover/active states | Done |
| MyList HC + ARIA — SagaCard rec button, saga wrapper border, Por ver divider, WatchlistSagaCard watched state, UnwatchedMoviePlaceholder; saga siblings excluded from recommendations drawer | Done |
| My list filters — title search, genre multi-select (when genres available), min-rating star filter (FiltersPanel); no-results state; filter bar hidden when list is empty | Done |
| Cypress settings HC test — high-contrast theme switch test added to settings.cy.ts | Done |
| Recommendations button aria-label with title context (MovieCard, SeriesCard, SagaCard) — screen readers distinguish between cards | Done |
| Episode count badge role=img + aria-label in SeriesCard ("X of Y episodes watched") | Done |
| RecommendationsDrawer closes on Escape key (document keydown listener) | Done |
| Top10Card star score color unified with StarRating: yellow-500 (light) / yellow-300 (dark) / amber-700 (HC) | Done |
| MyList component extraction — SagaCard, WatchlistSagaCard, UnwatchedMoviePlaceholder extracted to separate files; shared types in myListUtils.ts | Done |
| FiltersPanel clear-filters button repositioned left of chevron; always rendered (invisible when inactive) to prevent layout jump; data-cy="clear-filters" | Done |
| Cypress cypress-axe — imported in support/e2e.ts; accessibility.cy.ts checks login, home, movies, series, my-list pages (wcag2a + wcag2aa) | Done |
| Release calendar — today cell highlighted with solid bg-primary fill (was subtle ring); watchlist reminder dot (yellow) on days with a watchlist release (guest only) | Done |

---

## Architecture Decisions

**Persistent dashboard layout**
All dashboard pages live inside the `(dashboard)` route group. `layout.tsx` is a Server Component that decodes the JWT cookie to read the role, then passes it to `DashboardGroupLayoutClient` (`'use client'`) which renders `DashboardLayout` (Sidebar only — Topbar removed) and provides `DashboardRoleContext`. The layout is mounted once and never unmounts across client-side navigations. `activeNav` is derived from `usePathname()`. Each page has a `loading.tsx` (client component) that renders an immediate skeleton; movies uses 6 cols and series 7 — both roles see the same columns now that the watched-eye column was replaced by a poster ribbon. The Sidebar contains: bucket icon (collapsed) / Popcorn logo (expanded) at the top; a separator with a half-hanging circular toggle button (`ChevronLeft/Right`, `bg-primary`); nav items; Logout button pinned at the bottom.

**SSR-safe hydration**
Features that depend on Zustand `persist` stores (localStorage) are loaded with `dynamic(..., { ssr: false })` — they only render on the client, so store values are already rehydrated when the component mounts. No `useMounted` guard needed inside these components. The layout (`Sidebar`) is SSR'd and gates role-dependent nav items behind its own `mounted` state to avoid hydration mismatches. `DatePicker` uses `suppressHydrationWarning` on its placeholder span since the locale-specific placeholder text is non-critical and corrects itself after mount. Sidebar nav labels and the Sidebar logout button also carry `suppressHydrationWarning` — they are SSR'd in the persistent layout and contain translated text that diverges between server (always `'en'`, no localStorage) and client (user's stored language).

**Auth — self-hosted**
No external auth provider. Users in `data/popcorn.db` (gitignored, created on first run). Passwords hashed with bcrypt (cost 10). JWTs signed with `jose` using `JWT_SECRET` from env. Access token payload: `{ sub: userId, username, role }`. Refresh token payload: `{ sub: userId }`. Role is readable server-side without a DB roundtrip.

**Roles**
`admin` — full browse access + export + user management; cannot mark movies or episodes as watched. `guest` — browse + mark movies/episodes as watched + My list; no export, no user management. Role-based UI: ExportButton and watched-filter hidden for admin; "Mark as watched" button in MovieDetailModal and episode toggle buttons in SeasonsAccordion hidden for admin; BarChart user/global toggle hidden for admin (always shows global view); My list nav item hidden for admin.

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
`exportAsJSON` and `exportAsCSV` in `src/utils/exportData.ts`. Export fetches all pages before downloading. CSV uses `formatShortDate` and `formatVoteCount` for display formatting. JSON uses raw TMDB values. CSV files are prefixed with a UTF-8 BOM (`﻿`) so accented characters render correctly in Excel and LibreOffice. Only visible to `admin`.

**Vote count formatting**
`formatVoteCount` uses a regex (`/\B(?=(\d{3})+(?!\d))/g`) instead of `toLocaleString` — Node.js without full ICU data makes `toLocaleString` unreliable across environments.

**API separation**
Route Handlers in `src/app/api/` are thin (HTTP in/out only). Business logic lives in `src/services/`. All API responses return `{ code: string }` — never hardcoded text. Frontend translates via i18next (`auth.errors.*`, `tmdb.errors.*`).

**Auto theme**
Resolves light (7am–7pm) vs dark based on time of day — `resolveTheme.ts`. Applied via CSS custom properties on `[data-theme]` attribute set by `ThemeProvider`.

**State**
Separate Zustand stores per domain. `partialize` persists only the key field; `merge` recalculates derived state on rehydration. Language is stored per user in `languageStore` as `userLanguages: Record<userId, Language>` — default `'es'`. `applyUserLanguage(userId)` is called by `LanguageProvider` whenever `userId` changes (login/logout), and immediately after login in `useLogin`. `getStoredLanguage()` in `i18n.ts` reads both `popcorn-user` (for userId) and `popcorn-language` (for `userLanguages[userId]`) from localStorage synchronously before the first render, so i18n initialises in the user's language with no visible flash.

**SSR / hydration**
Features using i18n or theme loaded with `dynamic(..., { ssr: false })` to avoid server/client mismatches.

**TanStack Query (server state)**
All TMDB data fetching and the users list use `useQuery` from `@tanstack/react-query`. `QueryClientProvider` wraps the entire app in `GlobalProvider`. Default `staleTime: 5min` avoids redundant refetches for TMDB data. `enabled: id !== null` replaces the old null-fetcher pattern. Query keys are structured arrays (`['movie-detail', id, language]`) so language changes automatically invalidate cached data. The `useAsync` custom hook has been removed. Hook tests wrap `renderHook` in a `QueryClientProvider` with `retry: false` for deterministic test behavior. `useWatchProviders` accepts a `type: 'movie' | 'series'` parameter so movie and series provider queries get distinct cache entries despite sharing the same generic hook. User mutations (create, update, delete, bulk delete) use `useMutation`: `onSuccess` invalidates the `['users']` cache and queues the toast via `pendingToast` (fires on modal close); `onError` shows a toast for all errors except `USERNAME_TAKEN`, which is re-thrown to the form for inline display. Delete loading state is derived from `deleteOneMutation.isPending || deleteManyMutation.isPending`.

**User pagination (server-side)**
`GET /api/users` accepts `page`, `pageSize` (default 20), `username`, `role`, `created_after`, `created_by` as query params. `usersDb.findPaginated` builds a dynamic SQL `WHERE` clause and returns `{ users, total }` with `LIMIT/OFFSET`. The response shape is `{ users, totalPages, totalResults, creators }` — `creators` is the distinct list of users who appear as `created_by`, used to populate the filter dropdown without a second request. `UsersFeature` query key is `['users', page, filters]`; filter changes reset the page to 1 synchronously via `handleSetFilters` (no `useEffect`). Export calls `fetchUsers(1, {}, 9999)` to get all users regardless of the current page. Page size matches TMDB (20 results per page).

**Table loading/error/empty states**
`Table` accepts `loading`, `error`, `onRetry` and `emptyMessage` props. When `loading=true`, `TableBody` renders skeleton rows matching the real column structure — same headers, same widths, animated pulse cells. Error and empty states render as absolute overlays inside the table container. This eliminates the mount/unmount swap between `TableSkeleton` and `Table` that caused layout shifts. `MoviesFeature` and `SeriesFeature` render a single `<Table>` unconditionally; `loading.tsx` files use `PageSkeleton` (shared component: real `Header` + real `FiltersPanel` with `disabled` + `TableSkeleton`) — the real components are shown blocked immediately during bundle download so the page is never blank. Table footer (`TableFooter`) is always rendered regardless of row count; during `isLoading` it shows an animated skeleton matching the footer layout. Each `<th>` carries `sticky top-0 z-10 bg-background` individually — moving `sticky` from `<thead>` to each `<th>` avoids the GPU compositing conflict that caused Next.js `<Image>` layers to bleed through the header on scroll (`will-change-transform` on `<thead>` created a stacking context that lost the z-order fight).

**Error boundaries**
`ErrorBoundary` in `src/components/common/` is a React class component wrapping a functional `ErrorFallback` (needed because hooks cannot be used in class components). Wraps `MoviesPage`, `SeriesPage`, and `UsersPage`. On error, renders a translated message with a reset button that clears the error state and remounts the children.

**CI pipeline**
`.github/workflows/ci.yml` runs on every push and on PRs targeting `dev` or `main`. Three jobs: (1) `check` — Node 24, runs tsc, lint, jest, build; (2) `e2e` — Node 24, runs Cypress via `cypress-io/github-action@v6` against a production build, uploads screenshots on failure; (3) `docker` — builds and pushes the image to ghcr.io on `main` push only (needs both `check` and `e2e` to pass). Build steps use `NEXT_PUBLIC_TMDB_API_KEY` and `JWT_SECRET` from GitHub secrets; both fall back to placeholder values so CI passes without secrets configured. `jest.config.ts` is TypeScript and requires `ts-node` (in devDependencies). `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` is set at workflow level so the GitHub Actions runner (checkout, setup-node) also uses Node 24 internally.

**Watched store (v3)**
Per-user state keyed by `userId`. Movies stored as `StoredMovie` snapshots. Episodes stored as `Record<episodeId, { seasonNumber }>` — `seasonNumber` enables per-season counts without fetching episode lists. Series stored as `StoredSeries` on first episode mark. `filters.watched === 'watched'` bypasses TMDB entirely and serves local data with local pagination.

**Series background enrichment**
`SeriesFeature` runs `Promise.allSettled` after the list loads to fetch `status` and `number_of_episodes` per series. Cancelled via `AbortController` on cleanup. Results stored in `Map<id, value>` component state — not in Zustand.

**Movie release dates (regional)**
`fetchMovieDetail` passes `append_to_response: 'release_dates'` so the modal gets per-country release data. `getMovieUI` reads the ES theatrical date (type 2 or 3) via `resolveSpanishDate` and uses it as the authoritative `isUpcoming` / `resolvedDate` source — a movie released globally may still be upcoming in Spain. `moviesService.detail` accepts an optional `extra` params object so callers that only need basic data (runtime enrichment, Top10 genre backfill) don't fetch the release_dates payload unnecessarily.

**Watch providers**
Region hardcoded to `ES` (`WATCH_PROVIDERS_REGION` constant). `useWatchProviders(id, fetcher, type)` is a generic hook called directly from `MovieDetailModal` and `SeriesDetailModal` — the old `useMovieWatchProviders` / `useSeriesWatchProviders` wrappers have been removed. `fetchWatchProviderOptions` in `utils/watchProviders.ts` is the shared function for fetching + deduplicating provider options; both `movies.service.ts` and `series.service.ts` call it. Flatrate providers are sorted by `display_priority` and name-deduplicated via `deduplicateProviders` (generic, preserves subtypes). Rent and buy are merged into a single paid list tagged with `source: 'rent' | 'buy'`; rent takes precedence when a provider appears in both. Paid list is also deduplicated by `provider_id` first, then by name, and capped at 3. "In theaters" is detected via `/movie/{id}/release_dates` for ES — only type 3 (Theatrical) releases within the last 90 days qualify. Badge color uses `bg-primary` (burgundy in light, yellow in dark). Future: multi-country support via user preference.

**Import (bulk create)**
`ImportModal` in `src/components/common/` is fully generic: accepts an `onProcess(rows)` callback and renders the two-phase UI (upload → results) independently of the entity type. Thin wrappers (e.g. `ImportUsersModal`) wire the domain-specific API call and i18n strings. Required fields: `username`, `password`, `role`. Optional fields: `created_by` (admin username — defaults to the importing admin) and `created_at` (ISO date, today or earlier — defaults to current timestamp). CSV parser handles passwords with commas for any number of columns: it assumes `password` is always the second column and excess split parts are re-joined into it, with trailing columns consumed from the end. Password requirements for bulk import are validated server-side at `/api/users/import` using the same `PASSWORD_REGEX` as the single-user form (`^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$`). Failed rows are returned as `{ index, username, code }` and can be downloaded as CSV. Each row is processed independently — valid rows are created even if other rows fail. Intra-file duplicate usernames: first occurrence is created, subsequent ones get `IMPORT_USERNAME_DUPLICATE`.

**Docker**
Two-stage build (builder → runner) on Node 20 Alpine. `output: 'standalone'` in `next.config.ts` generates a minimal self-contained bundle in `.next/standalone/` — the runner stage copies only that output (~200 MB vs ~900 MB without standalone). Native deps (`better-sqlite3`, `bcryptjs`) are compiled in the builder stage and included in the standalone `node_modules` via nft tracing. The runner process runs as a non-root `nextjs:nodejs` user. A `HEALTHCHECK` pings `/login` every 30s (15s start period). `NEXT_PUBLIC_TMDB_API_KEY` is baked at build time — `docker compose --env-file .env.local up --build` is required. `docker-entrypoint.sh` creates `/app/data`, seeds via `scripts/docker-seed.js` on first run, then starts with `node server.js`. DB stored in named volume `popcorn_data`. `eslint.config.mjs` ignores `scripts/**` (CommonJS `require` incompatible with TS ESLint config).

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
| Pure functions | `getMovieUI`, `getSeriesUI`, `updateFilterValue`, `getTMDBImageUrl`, `resolveMode`, `formatVoteCount`, `formatShortDate`, `tmdbToStarRating` (TMDB 0–10 → Rating 0.5–5), `deduplicateProviders` (generic, subtype preservation), `buildGenreCounts` (aggregate, sort, slice top-10; per-entry name dedup), `applyRuntimeFilter` (undefined/0 threshold → passthrough, empty runtimes map → passthrough, filters by total duration, exact threshold kept, null rt passes through, missing from map passes through), `binPackSagas` (empty input, single row, two groups fitting/not fitting, gap-filling before new row, displayedCounts used for width), `computeSagasFirst` (sagas-first when saga watchedAt > standalone; standalone-first when no sagas; tie-break by most-recent watchedAt), `computeAllMovies` (SagaCard helper — rating-filtered watched movies still show as watched via full store; genuinely unwatched returns null; regression test for old group.movies approach), `parseJSON` (valid array, non-array throws, malformed throws), `parseCSV` (3-col, header-only, empty input, commas in password ×2, 5-col, 5-col with commas, trims whitespace) |
| Business logic | `applyClientFilters` (movies + series + language filter), `tmdbFetch` error mapping, `toCSV` (headers, quoting, empty rows) |
| Store | `watchedStore` — `toggleMovie`, `toggleEpisode` (seasonNumber, watchedAt), `markSeason` (watchedAt), per-season count derivation, auto-remove from watchlist on mark (movie/episode/season); `watchlistStore` — `toggleMovie` (add, addedAt, remove, per-user isolation), `toggleSeries` (add, addedAt, remove, per-user isolation), `removeMovie`/`removeSeries` (no-op safety); `toastStore` — addToast, timers, removeToast; `ratingsStore` — setRating, removeRating, per-user isolation |
| Hooks | `useMovieDetail`, `useSeriesDetail` (conditional fetch via `enabled`), `useWatchProviders` (flatrate/rent/buy merge, dedup, source tagging, loading), `useMovieInTheaters` (type 3 release, 90-day window), `useMovieReleases` (service call args), `useSeriesReleases` (disabled when no providers, enabled with providers), `useUserMovieTop10` / `useUserSeriesTop10` (genre_ids backfill via detail fetch, staleTime 5min), `useTrailer` (language preference via iso_639_1, YouTube filter, allTrailers list; disabled/enabled), `useEnrichedTrailers` (YouTube oEmbed batch fetch, replaces TMDB names with real YouTube titles, 24h cache), `useMovieRuntimeEnrichment` (empty map, populates runtime, null when no runtime, null on fetch fail, multiple movies, mixed success/failure), `useFilters` (initial state, setFilters, replaces entire object, preserves initial reference, exposes function) — all wrapped in `QueryClientProvider` with `retry: false` |
| Components | `Button`, `Modal`, `FiltersPanel` (collapse/expand, badge count, text/number/star/boolean/date/select types), `SeriesMetaGrid`, `ExportButton`, `ConfirmModal`, `UserFormModal`, `ToastItem`, `WatchProviders` (loading skeleton, badges, inTheaters chip), `ErrorBoundary` (children render, fallback on error, retry reset), `MediaPoster` (image render, null fallback, error fallback, loading prop, fluid variant, error recovery on URL change), `ReleaseCalendar` (header, Today button visibility, day selection, releases panel, X close, onEntryClick, no-overview state, loading/error states; axe: 7 states; ARIA: region, prev/next/close labels, full-date aria-label on day buttons, aria-pressed on selected), `CalendarReleaseItem` (heart visible for guest, hidden for admin, hidden when already watched), `StarRating` (5 stars, readonly mode, onChange, hover, half-star gradient), `GenreGrid` (renders badges; deduplicates by resolved name + icon — Avatar case: Action+Adventure share icon → one badge), `TrailerPlayer` (iframe with correct src, no close button without onClose, close button present and calls onClose, custom className), `SearchableSelect` (trigger label, X clear, open/close, search filtering, case-insensitive, empty state, option highlight, outside-click close), `YearRangePicker` (fromOptions capped at valueTo, toOptions floored at valueFrom, null callbacks), `FilterFieldInput` (all 8 field types: text/number/boolean/select/date/star/searchable-select/year-range/genre-multi; null guard for missing options/keyTo), `ToggleSwitch` (renders both labels, active has bg-primary, inactive does not, onChange with value, onChange on active option, role="group", reflects rerender), `MediaTableCells` — TitleCell (renders title, tooltip disabled when not truncated), GenresCell (null for undefined/empty, renders icons, multiple genres, deduplication by icon, filters null icons), PosterCell (renders poster, ribbon present when isWatched, ribbon absent when not watched, translated label), `StatusBadge` (undefined → animate-pulse, Ended, unknown status, Returning Series, In Production), `MediaCard` (axe, aria-label, onClick, children, selected ring), `MovieCard` (axe, title, year, StarRating, Similar button), `SeriesCard` (axe, name, episode badge, StarRating readonly state, Similar button), `WatchlistCard` (axe, title, year, remove button), `RecommendationsDrawer` (axe, complementary role, source name, items, excludes watchedIds, excludes saga siblings, onClose, onSelect) |
| Services | `apiFetch` (401 auto-refresh, redirect on session expiry) |
| API routes | `/api/users/import` (per-row validation: missing fields, invalid role/password, intra-file duplicate, DB duplicate, invalid creator, invalid date) |

### E2E (Cypress)

Tests live in `cypress/e2e/`. Requires the dev server running on port 3000.

```bash
npm run dev          # terminal 1
npm run cypress      # terminal 2 — opens Cypress UI
npm run cypress:run  # headless run
```

Cypress uses `cy.task('seedUser')` / `cy.task('deleteUser')` to manage test users directly in the SQLite DB. TMDB calls are intercepted with `cy.intercept`. CSS animations and transitions are globally disabled in `cypress/support/e2e.ts` via `window:before:load` hook (`animation-duration: 0s`, `transition-duration: 0s`) — prevents flakiness caused by `animate-fade-in` opacity states blocking interactions in headless CI.

| Suite | What's covered |
|---|---|
| `auth.cy.ts` | Redirect when unauthenticated, invalid credentials error, successful login, logout, guest redirect from /users, session expiry redirect (uses `cy.clearAllCookies()` — atomic, avoids race between two separate clearCookie calls in CI) |
| `movies.cy.ts` | Movie list, detail modal, watch providers, platform filter, star rating filter, genre multi-select filter, genre deduplication in modal, access control (guest), watched controls (admin/guest), trailer (button visible, open iframe, close via button, close via × in player), column sort (rating asc/desc — verifies sort_by param sent to TMDB), runtime filter (2h → 120min, 90min — verifies with_runtime.gte param), watchlist heart button (guest: visible + gains active style on click; admin: hidden) |
| `series.cy.ts` | Series list, detail modal, watch providers, platform filter, star rating filter, genre multi-select filter, genre deduplication in modal, watched controls (admin/guest), trailer (button visible, open iframe, close via button, close via × in player), column sort (rating asc/desc — verifies sort_by param sent to TMDB), runtime filter client-side (filters out series below total duration threshold; verifies with_runtime.gte NOT sent to TMDB), watchlist heart button (guest: visible + gains active style on click; admin: hidden) |
| `users.cy.ts` | List, create + toast, edit + toast, delete + toast, bulk delete + toast, self-protection, filters, import JSON + CSV, partial import failures, post-import cleanup |
| `settings.cy.ts` | Theme switching (light / dark / high contrast), language switching (EN / ES) |
| `accessibility.cy.ts` | axe-core wcag2a+wcag2aa checks on login, home, movies, series, my-list pages |
| `home.cy.ts` | Home header, content tab switch (Movies/Series), toggle defaults to Global when no watched data, My profile/Global toggle, empty state message, genre chart SVG renders, release calendar title and navigation, Top10 card title + year visible, calendar trailer button, Top10 genre dropdown (open, close, genre-filtered fetch, label update), calendar watchlist button (admin: hidden; guest: visible) |
| `my-list.cy.ts` | Page header + tabs, empty state (movies/series), nav item hidden for admin / visible for guest, watched movie visible, Recommendations button disabled without rating / enabled after ≥ 3.5★, saga name formatted (no "Collection"), section ordering (standalone-first / saga-first by watchedAt), series tab + episode progress badge + "Finish to rate", recommendations drawer opens (waits for not-disabled before click; saga drawer waits cy.wait('@collection') before click), unwatched saga placeholders visible, clicking placeholder opens detail modal, Por ver tab (visible, empty state, movie/series visible, count badge, remove on heart click), single-released-movie collection shown as standalone (not saga group); saga tests stub /collection API so CI placeholder TMDB key does not demote 2-part sagas |

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
- **`dev` and `main` are permanent protected branches — NEVER delete them**
- Only feature branches are deleted after merging (step 4 of the PR workflow)
- **All merges and branch deletions require explicit user authorization**
