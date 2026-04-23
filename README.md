# Popcorn 🍿

Personal movie & series dashboard. Track what you watch, discover new titles.

## Tech Stack

- **Next.js 16** + React 19 (App Router)
- **TypeScript 5** — path alias `@/*` → `src/*`
- **Tailwind CSS 4** + PostCSS
- **Zustand 5** — state management (theme & language)
- **i18next** + react-i18next — ES/EN internationalization
- **jose** — JWT utilities (Edge Runtime compatible)
- **clsx** — conditional class merging
- **ESLint 9** + Prettier — no semicolons, single quotes
- **Jest 30** + Testing Library — unit & integration tests

## Getting started

```bash
npm install
cp .env.local.example .env.local  # add your TMDB API key
npm run dev   # http://localhost:3000
```

Test credentials: `emilys` / `emilyspass`

## Commands

```bash
npm run dev         # development server
npm run build       # production build
npm run lint        # ESLint check
npm run lint:fix    # ESLint auto-fix
npm run format      # Prettier
npm test            # Jest test suite
npm run test:watch  # Jest watch mode
```

## Features

#### Movies
- Paginated movie list powered by TMDB discover & search endpoints
- Filter by title (TMDB search), rating and release year
- Filters panel collapsible with active filter count badge
- Language filter fixed to EN/ES content
- Click any row to open a detail modal: poster, metadata grid, genres, tagline
- Upcoming badge for unreleased movies
- Collection / saga accordion — click a part to reload the modal with that film

#### Theme
- Light, dark, and auto modes (auto resolves by time of day: light 7am–7pm)
- Managed with Zustand, persisted in localStorage
- Switched via the Settings modal (gear icon in sidebar)

#### Language
- English / Spanish — auto-detects browser language on first visit
- State persisted with Zustand, synced to i18n via `onRehydrateStorage`
- Switched via the Settings modal

#### Authentication
- Login UI with skeleton loading, field validation and i18n error messages
- Route protection via Next.js middleware (`src/middleware.ts`)
- HttpOnly cookie-based sessions — `token` (1h) + `refresh_token` (7d)
- Login, logout and refresh via Route Handlers (`src/app/api/auth/`)
- Auth logic isolated in `src/services/auth/` (DummyJSON as mock provider)

#### PWA
- Favicons in `/public/icons/`, manifest at `/public/manifest.json`

## Project Structure

```
src/
├── app/
│   ├── api/auth/           # login / logout / refresh — Route Handlers (thin)
│   ├── login/              # Login page (ssr: false)
│   ├── movies/             # Movies page (ssr: false)
│   ├── series/             # Series page (ssr: false)
│   └── page.tsx            # → redirects to /movies
├── components/
│   ├── common/             # FiltersPanel, MoviePoster, MetaRow, Sidebar, Topbar, SettingsModal
│   ├── layouts/            # AuthLayout, DashboardLayout
│   └── ui/                 # Button, Input, Text, Modal, Header, AccordionList, Table/
├── config/                 # Constants split by domain (auth, i18n, tmdb, constants)
├── features/
│   ├── auth/login/         # LoginFeature, LoginForm, useLogin, login.service.ts
│   ├── dashboard/          # Placeholder
│   ├── movies/             # MoviesFeature, useMovies, useMovieDetail, useCollectionDetail,
│   │                       # MovieDetailModal, CollectionAccordion, MovieMetaGrid, movies.service.ts
│   └── series/             # SeriesFeature (coming soon)
├── hooks/                  # useAsync (generic), useFilters, useTranslation
├── locales/                # en.json, es.json
├── middleware.ts            # Route protection
├── providers/              # GlobalProvider, ThemeProvider, LanguageProvider
├── services/
│   ├── auth/               # DummyJSON client
│   └── tmdb/               # TMDB client (movies, series, search) + tmdbFetch
├── store/                  # themeStore, languageStore
├── styles/
│   ├── theme/              # resolveTheme, types
│   └── globals.css         # Tailwind @theme tokens, semantic light/dark vars
├── types/                  # tmdb.ts, movie.ts, table.ts, languageTypes.ts
└── utils/                  # getTMDBImageUrl, getMovieUI, updateFilterValue
```

## Architecture Decisions

- **API separation**: `src/app/api/` holds Route Handlers; `src/services/` holds all external API clients. Route Handlers are thin — business logic lives in services.
- **Auth**: Two HttpOnly cookies — `token` (1h) and `refresh_token` (7d). Set on login, both cleared on logout or failed refresh.
- **Auth provider**: DummyJSON (`dummyjson.com/auth`). Login field accepts username (not email). Test credentials: `emilys` / `emilyspass`.
- **TMDB**: Strictly a data provider. Never used for user authentication. API key is `NEXT_PUBLIC_` (client-visible) — acceptable for read-only personal projects.
- **Movie filters**: title filter uses `/search/movie` (server pagination); rating/year use `/discover/movie` params. `vote_average_gte` applied client-side only when title search is active.
- **Error codes**: API responses return `{ code: string }` — never hardcoded text. Frontend translates via i18next.
- **Auto theme**: resolves light (7am–7pm) vs dark based on time of day — see `resolveTheme.ts`.
- **State**: separate Zustand stores per domain. `partialize` persists only the key field; `merge` recalculates derived state on rehydration.
- **SSR / hydration**: features using i18n or theme use `dynamic(..., { ssr: false })`.
- **Middleware**: skips all `/api/*`. Redirects unauthenticated users → `/login`; authenticated users away from auth routes → `/movies`.
- **useAsync**: generic hook (`useAsync<T>`) centralises all data-fetching state — `loading / data / error` — removing duplicated reducer boilerplate across hooks.
- **PWA**: manifest + favicons configured in root layout.

## Conventions

- New features go in `src/features/`
- External API clients go in `src/services/`
- Route Handlers go in `src/app/api/` and must stay thin
- UI primitives go in `src/components/ui/`, layout wrappers in `src/components/layouts/`, shared non-UI in `src/components/common/`
- Constants split by domain in `src/config/`
- API responses always return `{ code: string }`, never hardcoded messages
- User-facing strings always via `t()` — add keys to both `en.json` and `es.json`
- No hex/rgb in JSX — use design token classes only
- No manual font-size/weight/line-height — use `<Text variant="...">` component
- Inline `style={{}}` only for runtime-computed values (positions, dynamic heights)
- Tests co-located with source files (`*.test.ts` / `*.test.tsx`)
- Tests, TypeScript and ESLint must all pass before opening a PR

## Git Workflow

Branch flow: `feature → dev → main`

- Feature branches are always created from `dev`
- Before opening a PR: `npm test`, `tsc --noEmit` and `npm run lint` must all pass
- Merge feature PR into `dev`; run build-check on `dev`; only then merge `dev` into `main`
- `main` is always stable and production-ready
- All merges and branch deletions require explicit user authorization
