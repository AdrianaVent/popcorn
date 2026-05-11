# Popcorn 🍿

Personal movie & series dashboard. Track what you watch, explore collections, and manage your watchlist — all in one place.

---

## What you can do

| | Admin | Guest |
|---|---|---|
| Browse movies & series (TMDB) | ✓ | ✓ |
| Filter by title, rating, year, language, platform | ✓ | ✓ |
| Mark movies and episodes as watched | ✓ | ✓ |
| Switch language (English / Spanish) | ✓ | ✓ |
| Switch theme (Light / Dark / Auto) | ✓ | ✓ |
| Export your data (JSON / CSV) | ✓ | — |
| Manage users (create, edit, delete, bulk delete) | ✓ | — |
| Import users from JSON / CSV | ✓ | — |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```env
NEXT_PUBLIC_TMDB_API_KEY=   # your TMDB API key (free at themoviedb.org)
JWT_SECRET=                 # any long random string, e.g. openssl rand -base64 32
```

### 3. Create your admin user

```bash
npm run seed
```

This creates a default admin: `admin` / `Admin123!`

To use custom credentials:

```bash
npm run seed <username> <password>
```

> Passwords must be at least 8 characters and include one uppercase letter, one number and one special character.

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in. After login you land on the Home dashboard.

---

## Features

### Home

A personal dashboard at `/home` with two side-by-side cards:

- **Genre distribution** — one chart for movies and one for series. Each chart lets you toggle between **My profile** (genres from your watched list) and **Global** (genres from the TMDB popular catalogue). Bar charts are built with Recharts.
- **Release calendar** — monthly view of upcoming EN/ES movie and series releases from TMDB. Days with releases are marked with a dot. Click a day to select it. Navigate month by month; switch between movies and series with the tabs above.

### Movies & Series

Browse titles powered by TMDB. Filter by title, minimum rating, release year, original language and streaming platform. Click any row to open a detail panel with the overview, genres, runtime, vote count and collection info.

### Watch providers

The detail panel shows where each title is available in Spain — subscription platforms (flatrate), rentals (€ badge) and purchases (cart badge). Movies released in cinemas in the last 90 days show an "In theaters" chip.

### Watched tracking

Mark movies as watched and track individual episodes per series. Your progress is saved per user in the browser's localStorage.

### Export

Admins can export the full movie or series list as **JSON** (raw TMDB data) or **CSV** (formatted for spreadsheets). The export fetches all pages before downloading.

### User management

Admins can create, edit and delete users, assign roles (admin / guest), and filter the list by username, role, creation date or creator. Bulk delete is supported. Admins cannot delete or demote their own account. The list is paginated server-side (20 per page) — filtering and pagination happen entirely in SQL, keeping the response size constant regardless of total user count.

### Import users

Admins can bulk-create users by uploading a **JSON** or **CSV** file. Each row is validated independently — valid rows are created even if others fail. Errors are reported per row and can be downloaded as a file for correction and re-upload. Password requirements, role validity, duplicate detection (within the file and against the DB), creator attribution and date are all validated server-side.

### Session auto-refresh

When the access token (1h) expires, the app automatically attempts to refresh it in the background. If the refresh succeeds the current request is retried transparently. If the refresh also fails the user is redirected to `/login`.

### Smart caching

All TMDB data is cached with **TanStack Query**. Switching between pages is instant for recently visited content, and changing the language automatically invalidates the cache to refetch translated data.

### Theme & Language

The **auto** theme switches between light (7am–7pm) and dark automatically. Language is stored **per user** — it defaults to Spanish and can be changed at any time from the Settings modal. Both preferences are persisted across sessions.

---

## Running tests

### Unit tests (Jest)

```bash
npm test           # run once
npm run test:watch # watch mode
```

Covers pure functions, business logic, stores, hooks and components.

### End-to-end tests (Cypress)

Cypress tests run against the live dev server. Make sure you have run `npm run seed` at least once first — Cypress needs the database to exist before it can create its own test users.

```bash
# First time only — creates the database
npm run seed

# Terminal 1
npm run dev

# Terminal 2 — interactive UI
npm run cypress

# Terminal 2 — headless
npm run cypress:run
```

The test suite covers:

| Suite | What's tested |
|---|---|
| `auth.cy.ts` | Redirect when unauthenticated, invalid credentials error, login, logout, session expiry redirect |
| `home.cy.ts` | Genre charts, Movies/Series tab switch, My profile/Global toggle, empty state, SVG renders, release calendar title and navigation |
| `movies.cy.ts` | Movie list, detail modal, watch providers, platform filter, access control |
| `series.cy.ts` | Series list, detail modal, watch providers, platform filter |
| `users.cy.ts` | Create, edit, delete (single + bulk), toast notifications, import (JSON / CSV, errors, partial failures) |
| `settings.cy.ts` | Theme switching (light / dark), language switching (EN / ES) |

Cypress creates and cleans up its own test users in the local database automatically.

---

## All commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run Jest unit tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run cypress` | Open Cypress UI |
| `npm run cypress:run` | Run E2E tests headlessly |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format |
| `npm run seed` | Create default admin user |

---

## Project structure

```
src/
├── app/api/auth/       # login · logout · refresh — thin Route Handlers
├── components/
│   ├── common/         # FiltersPanel, ExportButton, Sidebar, SettingsModal, ...
│   ├── layouts/        # AuthLayout, DashboardLayout
│   └── ui/             # Button, Input, Text, Modal, ModalFooter, Header,
│                       # DatePicker, ConfirmModal, IconButton, Table/, LoadingOverlay,
│                       # Toast/ToastItem, Toast/ToastContainer, BarChart, ToggleSwitch, ...
├── config/             # auth.ts · tmdb.ts · i18n.ts · constants.ts
├── db/                 # client.ts (SQLite singleton) · users.ts (typed queries)
├── features/
│   ├── auth/login/     # LoginFeature · useLogin · login.service.ts
│   ├── home/           # HomeFeature · useMovieGenres · useSeriesGenres · ReleaseCalendar
│   ├── movies/         # MoviesFeature · hooks · components · service
│   ├── series/         # SeriesFeature · hooks · components · service
│   └── users/          # UsersFeature · UserFormModal · ImportUsersModal · users.service.ts
├── hooks/              # useFilters · useWatchProviders
├── locales/            # en.json · es.json
├── middleware.ts        # JWT verification + route protection
├── providers/          # GlobalProvider · ThemeProvider · LanguageProvider
├── services/
│   ├── apiFetch.ts     # fetch wrapper — auto-refresh on 401, redirect to /login on expiry
│   ├── auth/           # authService — bcrypt verify, JWT sign/refresh
│   └── tmdb/           # TMDB client — movies, series, search
├── store/              # themeStore · languageStore · userStore · watchedStore · toastStore
└── utils/              # formatDate · formatNumber · exportData · getTMDBImageUrl · ...
cypress/
├── e2e/                # auth · movies · users test suites
├── fixtures/           # mocked TMDB responses
└── support/            # commands.ts (cy.login) · e2e.ts (global hooks)
scripts/
└── seed.ts             # Creates an admin user
data/
└── popcorn.db          # SQLite database — gitignored, auto-created on first run
```

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 + React 19 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + PostCSS |
| State | Zustand 5 — persisted in localStorage |
| Server state | TanStack Query 5 — caching, background refetch |
| i18n | i18next + react-i18next — English / Spanish |
| Auth | jose (JWT) · better-sqlite3 · bcryptjs |
| Unit tests | Jest 30 + Testing Library |
| E2E tests | Cypress 15 |
| Linting | ESLint 9 + Prettier |
| CI | GitHub Actions — tsc, lint, jest, build on every push |

---

## Git workflow

```
feature → dev → main
```

- Feature branches are always cut from `dev`
- Before a PR: `npm test` + `tsc --noEmit` + `npm run lint` must all pass
- After merging to `dev`: run build-check — only then merge `dev` into `main`
- `main` is always stable and production-ready
