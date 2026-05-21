# Popcorn 🍿

![Version](https://img.shields.io/badge/version-0.10.0-6B2737)
![Built with Claude](https://img.shields.io/badge/built%20with-Claude%20Code-black?logo=anthropic)

Personal movie & series dashboard. Track what you watch, explore collections, and manage your watchlist — all in one place.

> Optimised for desktop and tablet (768px and above). Mobile is not supported.

**Author:** Adriana Ventura Candela &nbsp;·&nbsp; [GitHub](https://github.com/AdrianaVent) &nbsp;·&nbsp; [LinkedIn](https://www.linkedin.com/in/adriana-ventura-candela-9a942510b/)

---

## What you can do

| | Admin | Guest |
|---|---|---|
| Browse movies & series (TMDB) | ✓ | ✓ |
| Filter by title, rating, year, language, platform, status | ✓ | ✓ |
| Sort and paginate results | ✓ | ✓ |
| View watch providers by region | ✓ | ✓ |
| Home dashboard — genre charts (global view only) | ✓ | — |
| Home dashboard — genre charts (personal + global view) | — | ✓ |
| Home dashboard — release calendar | ✓ | ✓ |
| Mark movies and episodes as watched | — | ✓ |
| View and rate watched titles (My list) | — | ✓ |
| Switch language (English / Spanish) | ✓ | ✓ |
| Switch theme (Light / Dark / Auto) | ✓ | ✓ |
| Change region (Spain / United States) | ✓ | ✓ |
| Export movies & series (JSON / CSV) | ✓ | — |
| Export users (JSON / CSV) | ✓ | — |
| Manage users (create, edit, delete, bulk delete) | ✓ | — |
| Import users from JSON / CSV | ✓ | — |

![Login screen](docs/screenshots/login.png)

---

## About this project

Popcorn is a full-stack personal dashboard built to demonstrate modern web development practices with **Next.js 16** and **TypeScript 5**.

### Tech choices

**Next.js App Router + React 19** — the app uses the App Router with a clear separation between Server and Client Components. The persistent dashboard layout is a Server Component that decodes the JWT cookie to read the user role, passing it down to a client layout via React Context. Each page has a role-aware loading skeleton that renders immediately during bundle download so the UI is never blank.

**Self-hosted auth (no third-party provider)** — users are stored in a local SQLite database (better-sqlite3), passwords hashed with bcrypt and sessions managed with short-lived JWTs (jose, Edge Runtime compatible). Access tokens expire after 1 hour; a refresh token (7 days) allows silent renewal via an `apiFetch` wrapper that retries on 401 automatically.

**Role-based access control** — two roles (admin / guest) enforced at every layer: middleware (JWT verification, route protection), API route handlers (`requireAdmin` guard), and UI (conditional rendering, hidden controls).

**TanStack Query for server state** — all TMDB data goes through `useQuery` with structured cache keys (`['movie-detail', id, language]`). Language changes automatically invalidate the cache. Mutations (user management) use `useMutation` with optimistic cache invalidation.

**Client-side persistence with Zustand** — watched movies and episodes, ratings, language and theme preferences are all stored per user in localStorage via Zustand persist stores. An `ssrStorage` adapter prevents hydration mismatches in Next.js SSR.

**Testing strategy** — unit and integration tests with Jest + Testing Library cover pure functions, stores, hooks and components. End-to-end tests with Cypress cover full user flows (auth, movies, series, user management, settings) against a live dev server with a real SQLite database.

**CI pipeline** — GitHub Actions runs TypeScript check, ESLint, Jest and a Next.js production build on every push.

**Local-first by design** — the app runs entirely on your machine. User data is stored in a local SQLite database, watched history and preferences in localStorage. There is no cloud deployment or external backend — this keeps the setup self-contained and the focus on the front-end and full-stack architecture rather than infrastructure.

### AI-assisted development

This project is being built with **[Claude Code](https://claude.ai/code)** (Anthropic) as an AI pair programmer. All product, design and architecture decisions are made by the developer — what to build, how to structure it, which trade-offs to accept and how the UI should behave. Claude assists with implementation, flags potential issues and suggests improvements during development. This workflow reflects how modern development teams are increasingly integrating AI tools into their day-to-day engineering process without transferring ownership of technical judgement.

---

## Getting started

### Step 1 — Prerequisites

You need **Node.js** (which includes npm) installed on your machine.

#### Check if you already have it

Open a terminal and run:

```bash
node -v
npm -v
```

If both commands print a version number (e.g. `v22.0.0` and `10.0.0`) you are ready — skip to [Step 2](#step-2--download-the-project).

#### Install Node.js

Go to [nodejs.org](https://nodejs.org) and download the **LTS** version for your operating system. Run the installer and follow the prompts. Once installed, close and reopen your terminal, then verify with `node -v` and `npm -v`.

> The app requires Node.js 18 or newer.

---

### Step 2 — Download the project

#### Option A — Git clone (recommended)

If you have Git installed:

```bash
git clone https://github.com/AdrianaVent/popcorn.git
cd popcorn
```

To check if Git is installed run `git --version`. If it is not, download it from [git-scm.com](https://git-scm.com).

#### Option B — Download ZIP

1. Go to the repository page on GitHub
2. Click the green **Code** button → **Download ZIP**
3. Extract the ZIP file
4. Open a terminal and `cd` into the extracted folder

---

### Step 3 — Install dependencies

Inside the project folder run:

```bash
npm install
```

This downloads all libraries listed in `package.json`. It may take a minute.

> **Note on deprecation warnings** — you may see `npm warn deprecated` messages for packages like `inflight` or `whatwg-encoding`. These come from transitive dependencies inside Jest and jsdom and are outside our control. They do not affect functionality, the build, or the tests.

---

### Step 4 — Configure environment variables

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Open `.env.local` in any text editor and fill in the two required values:

```env
NEXT_PUBLIC_TMDB_API_KEY=   # your TMDB API key — free at themoviedb.org
JWT_SECRET=                 # any long random string — run: openssl rand -base64 32
```

**Getting a TMDB API key:**

1. Create a free account at [themoviedb.org](https://www.themoviedb.org)
2. Go to **Settings → API** and request an API key (select "Developer")
3. Copy the **API Key (v3 auth)** value

**Generating a JWT secret** (macOS / Linux):

```bash
openssl rand -base64 32
```

On Windows you can use any long random string, for example one generated at [randomkeygen.com](https://randomkeygen.com).

---

### Step 5 — Create your first admin user

```bash
npm run seed
```

This creates a default admin account: `admin` / `Admin123!`

To choose your own credentials:

```bash
npm run seed <username> <password>
```

> Passwords must be at least 8 characters and include one uppercase letter, one number and one special character (e.g. `!`, `@`, `#`).

**Create a guest user to explore the full experience**

The admin role cannot mark movies as watched, rate titles or use My list — those features are guest-only. To try everything the app offers, sign in as admin, go to **Users → Add user**, and create an account with the **Guest** role. Then log out and sign in with the new credentials.

---

### Step 6 — Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and sign in with the credentials you created in the previous step. After login you land on the Home dashboard.

---

## User Manual

---

### Home (`/home`)

The landing page after login. It shows three cards in a responsive grid: a Top 10 ranking, a genre distribution chart, and a release calendar. The grid adapts to the available width — cards stack in a single column on narrow viewports, two columns on medium widths, and all three side by side on wide screens.

**Top 10**

A ranked list of the top 10 movies or series by rating. Each entry shows the poster, title, release year, genre icons and score.

- Use the **My profile / Global** toggle to switch between your personal watched history and the full TMDB catalogue.
- Filter by genre using the genre picker in the card header.
- The toggle is not available for admin accounts — admins always see the global view.
- Click any entry to open its detail modal.

**Genre distribution**

![Home — overview with Top 10 and genre chart](docs/screenshots/home-charts.png)

A donut chart showing which genres appear most — either in the TMDB catalogue or in your own watched history. The legend lists all genres with their colour; hover a slice or a legend item to highlight it and see the percentage.

- Use the **My profile / Global** toggle (top-right) to switch data source.
- Switch between **Movies** and **Series** with the icon buttons in the card header.
- The toggle is not available for admin accounts — admins always see the global view.

**Release calendar**

![Home — release calendar with day selected](docs/screenshots/home-calendar.png)

A monthly calendar showing upcoming movie and series releases from TMDB (English and Spanish titles).

- Days with at least one release are marked with a coloured dot.
- Click a day to open a panel listing all releases for that date.
- Click any entry in the panel to open its detail modal.
- Use the **←** and **→** arrows to navigate between months. The **Today** button returns to the current month.
- Switch between **Movies** and **Series** with the icon buttons in the card header.

---

### Movies (`/movies`)

A paginated table of movies from TMDB, sorted by popularity by default.

**Browsing and filtering**

![Movies list with active filters](docs/screenshots/movies-list.png)

The **Filters** panel sits at the top of the page. Click the chevron on the right to collapse it — when collapsed, any active filters are shown as summary pills in the header so you can see what is applied at a glance. Click **Clear filters** to reset everything without having to expand the panel first.

Use the filters to narrow the list:

| Filter | How it works |
|---|---|
| Title | Searches TMDB in real time. Sorting is disabled while a search is active. |
| Rating ≥ | Drag or click a star value. Only titles rated at or above the threshold are shown. |
| Year | Shows titles released in that calendar year. |
| Language | Filters by original language (English or Spanish). |
| Genres | Multi-select genre picker. Select one or more genres to filter by. |
| Platform | Shows titles available on a specific streaming service in Spain. |
| Watched | Switch between **All**, **Watched** and **Unwatched** (guest only). |

**Sorting**

Click a column header to sort by that field. Click again to reverse the order. Sorting by title loads all matching pages from TMDB and sorts them client-side (TMDB does not support server-side title sort reliably).

**Marking a movie as watched** *(guest only)*

The first column shows an eye icon for each row. Click it to toggle the movie between watched and unwatched. The icon fills in to indicate watched status. You can also mark movies from the detail modal (see below).

**Opening the detail modal**

Click anywhere on a row to open a panel with full information about the movie.

![Movie detail — overview and watch providers](docs/screenshots/movie-detail-overview.png)

The modal shows the **synopsis**, **genres**, **runtime**, **release year**, **vote count** and **watch providers** — where the title is available in Spain (subscription, rental, purchase).

- Mark the movie as **watched / unwatched** with the button next to the title *(guest only)*.
- The TMDB rating is displayed as stars (0.5–5 scale).

**Sagas**

![Movie detail — saga accordion expanded](docs/screenshots/movie-detail-saga.png)

If the movie belongs to a collection, a **Saga** accordion lists all films in the series. Click any title to navigate to that film without closing the modal. The accordion also shows which films you have already marked as watched.

**Movies currently in cinemas**

![Movie detail — in theaters chip](docs/screenshots/movie-detail-theaters.png)

Movies released in Spanish cinemas within the last 90 days show an **In theaters** chip next to the streaming platform badges.

---

### Series (`/series`)

Works the same way as the Movies section — same filters, sorting, eye icon column and export button — with one addition: episode-level tracking.

The **Watched** filter and the eye icon column are available to guest accounts only. The **Export** button is available to admin accounts only.

**Browsing and filtering**

![Series list with active filters](docs/screenshots/series-list.png)

The series list includes a **Status** filter (airing, ended, cancelled...) not available in Movies. All other filters work identically.

**Opening the detail modal**

Click anywhere on a row to open a panel with full information about the series.

![Series detail — overview and watch providers](docs/screenshots/series-detail-overview.png)

The modal shows the **synopsis**, **genres**, **episode runtime**, **status**, total number of **seasons and episodes**, and **watch providers**. Mark the series as watched with the button next to the title *(guest only)*.

**Episode tracking** *(guest only)*

![Series detail — seasons accordion expanded](docs/screenshots/series-detail-seasons.png)

Expand the **Seasons** accordion to see the full episode list broken down by season.

- Click the eye icon next to an episode to mark it as watched individually.
- Click the eye icon next to the season header to mark all available episodes in that season at once (future air dates are excluded).
- Click the season eye icon again to unmark the entire season.

---

### My list (`/my-list`) — guest only

A personal overview of everything you have marked as watched. Admin accounts do not have access to this section.

**Movies tab**

![My list — movies grouped by saga](docs/screenshots/my-list-movies.png)

Displays your watched movies as a card grid (poster, title, year and star rating).

- Click the stars to rate a movie from 0.5 to 5.
- Enable **Group by saga** to reorganise the grid: movies that belong to the same collection are grouped under a shared header, in release order. Movies without a saga appear under a separate "Standalone" section.

**Series tab**

![My list — series tab](docs/screenshots/my-list-series.png)

Displays your watched series using the same card layout.

- Series where you have not yet finished all episodes show a diagonal **Watching** ribbon and cannot be rated yet.
- Completed series display a badge with the total episode count and allow you to leave a star rating.

Ratings are stored locally per user — they are not sent to TMDB.

---

### Export *(admin only)*

Available from the **Movies** and **Series** pages via the export button in the top-right corner.

- **JSON** — raw TMDB data for all titles matching the current filters.
- **CSV** — human-readable format (formatted dates, rating as `X / 10`, vote count with thousands separator). Optimised for Excel and LibreOffice (UTF-8 BOM included).

The export always fetches all pages before downloading — the file contains the full result set, not just the current page.

---

### User management (`/users`) — admin only

A paginated list of all user accounts.

**Browsing and filtering**

![Users list](docs/screenshots/users-list.png)

Use the filter panel to search by username, role, creation date or creator (the admin who created the account).

**Creating a user**

![Add user modal](docs/screenshots/users-add.png)

Click **Add user**, fill in the username, password and role (admin or guest), and confirm. The new user appears immediately in the list.

> Password requirements: at least 8 characters, one uppercase letter, one number and one special character.

**Editing a user**

Click the edit icon on any row to open a form with the current values pre-filled. Leave the password field blank to keep the existing password.

**Deleting users**

![Delete confirmation dialog](docs/screenshots/users-delete.png)

- Click the delete icon on a row to delete a single user. A confirmation dialog will appear before the action is executed.
- Select multiple rows using the checkboxes and click **Delete selected** for a bulk deletion.

Admins cannot delete or change the role of their own account.

**Importing users in bulk**

![Import users modal](docs/screenshots/users-import.png)

Click **Import** to upload a JSON or CSV file and create multiple accounts at once. Expected formats:

```json
[{ "username": "...", "password": "...", "role": "admin|guest" }]
```

```
username,password,role
alice,Pass123!,guest
bob,Pass456!,admin
```

![Import results](docs/screenshots/users-import-results.png)

After processing, a results screen shows how many accounts were created and lists any rows that failed with the reason for each error. Failed rows can be downloaded as a CSV for correction and re-upload.

---

### Settings

Click the gear icon in the sidebar to open the settings panel.

![Settings modal](docs/screenshots/settings.png)

- **Language** — switch between English and Spanish. Defaults to Spanish on first login. The preference is stored per user in localStorage and applied immediately across the entire interface with no page reload — i18next resolves the stored language before the first render to avoid any visible flash.
- **Region** — switch between Spain and United States. Determines which streaming platforms are shown in the watch providers section of every movie and series detail modal.
- **Theme** — choose Light, Dark or Auto. The Auto mode resolves the theme based on time of day (light from 7am to 7pm, dark otherwise) without requiring any user interaction. All three preferences are persisted in localStorage and restored across sessions.

---

### Session management

The access token expires after 1 hour. When that happens the app automatically requests a new token in the background — the current action is retried transparently and you will not be interrupted. If the refresh also fails (e.g. the refresh token has expired after 7 days), you are redirected to the login page.

---

## Running tests

The project has two test layers: **461 unit/integration tests** (Jest) and **93 end-to-end tests** (Cypress). Both run automatically in CI on every push.

### Unit & integration tests (Jest) — 461 tests · 44 suites

```bash
npm test           # run once
npm run test:watch # watch mode
```

| Area | What's covered |
|---|---|
| Pure functions | `getMovieUI`, `getSeriesUI`, `formatDate`, `formatVoteCount`, `deduplicateProviders`, `buildGenreCounts`, `toCSV` |
| Business logic | Client-side filters (movies + series), TMDB fetch error mapping, export utilities |
| Stores | `watchedStore` (toggle movie/episode, season counts), `toastStore` (queue, timers), `ratingsStore` (per-user isolation) |
| Hooks | `useMovieDetail`, `useSeriesDetail`, `useWatchProviders`, `useMovieInTheaters`, `useMovieReleases`, `useSeriesReleases` |
| Components | `Button`, `Modal`, `FiltersPanel`, `StarRating`, `ConfirmModal`, `UserFormModal`, `ImportModal`, `WatchProviders`, `MediaPoster`, `ReleaseCalendar`, `ErrorBoundary`, `ToastItem`, `ContentTabToggle`, `GenreGrid` (name deduplication) |
| Services | `apiFetch` (401 auto-refresh, session expiry redirect) |
| API routes | `/api/users/import` (field validation, role/password rules, duplicates, invalid creator/date) |

### End-to-end tests (Cypress) — 93 tests · 7 suites

In CI, Cypress runs against the production build automatically. Locally, run against the dev server:

```bash
# Terminal 1
npm run dev

# Terminal 2 — interactive UI
npm run cypress

# Terminal 2 — headless
npm run cypress:run
```

| Suite | Tests | What's covered |
|---|---|---|
| `auth.cy.ts` | 6 | Redirect when unauthenticated, invalid credentials, login, logout, session expiry |
| `home.cy.ts` | 17 | Genre charts, tab switch, My profile/Global toggle, empty state, release calendar, Top 10 year display |
| `movies.cy.ts` | 24 | Movie list, detail modal, watch providers, genre multi-select filter, platform filter, star rating filter, genre deduplication, access control |
| `series.cy.ts` | 19 | Series list, detail modal, watch providers, genre multi-select filter, platform filter, star rating filter, genre deduplication, episode runtime guard |
| `users.cy.ts` | 15 | Create, edit, delete (single + bulk), toasts, import JSON/CSV, partial failures |
| `my-list.cy.ts` | 9 | Tabs, empty state, watched movies/series, saga grouping, nav access control |
| `settings.cy.ts` | 3 | Theme switching (light / dark), language switching (EN / ES) |

Cypress creates and cleans up its own test users in the local database automatically. TMDB calls are intercepted — no real API key needed to run the E2E suite.

---

## Docker

You can run Popcorn in a container without installing Node.js or configuring a local database.

### Prerequisites

- [Docker](https://www.docker.com/) installed and running
- `.env.local` configured (same file used for local development — see [Getting started](#getting-started))

### Run with Docker Compose

If you haven't already, copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

Then start the container:

```bash
docker compose --env-file .env.local up --build
```

The `--env-file` flag is required so Docker can read your API key at build time — `NEXT_PUBLIC_TMDB_API_KEY` is baked into the client bundle during the build step and is not injectable at runtime.

Open [http://localhost:3000](http://localhost:3000). On first run the database is created automatically and a default admin user is seeded:

| Field | Default |
|---|---|
| Username | `admin` |
| Password | `Admin123!` |

You can override the default credentials via environment variables in `.env.local`:

```
ADMIN_USERNAME=myadmin
ADMIN_PASSWORD=MyPassword1!
```

The database is stored in a Docker volume (`popcorn_data`) and persists between container restarts.

> **Note on the TMDB API key** — `NEXT_PUBLIC_TMDB_API_KEY` is baked into the client bundle at build time. If you change it you must rebuild the image (`docker compose up --build`).

### Useful commands

```bash
docker compose --env-file .env.local up --build   # build and start
docker compose --env-file .env.local up -d        # start in background
docker compose down                               # stop and remove container
docker compose down -v                            # stop and delete data volume (resets the database)
```

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
│   ├── layouts/        # AuthLayout, DashboardLayout, PageLayout
│   └── ui/             # Button, Input, Text, Modal, ModalFooter, Header,
│                       # DatePicker, ConfirmModal, IconButton, Table/, LoadingOverlay,
│                       # Toast/ToastItem, Toast/ToastContainer, BarChart, ToggleSwitch,
│                       # StarRating, Tooltip, ...
├── config/             # auth.ts · tmdb.ts · i18n.ts · constants.ts
├── db/                 # client.ts (SQLite singleton) · users.ts (typed queries)
├── features/
│   ├── auth/login/     # LoginFeature · useLogin · login.service.ts
│   ├── home/           # HomeFeature · useMovieGenres · useSeriesGenres · ReleaseCalendar
│   ├── movies/         # MoviesFeature · hooks · components · service
│   ├── myList/         # MyListFeature · MovieCard · SeriesCard (tabs, saga grouping, ratings)
│   ├── series/         # SeriesFeature · hooks · components · service
│   └── users/          # UsersFeature · UserFormModal · ImportUsersModal · users.service.ts
├── hooks/              # useFilters · useWatchProviders · useTruncated
├── locales/            # en.json · es.json
├── middleware.ts        # JWT verification + route protection
├── providers/          # GlobalProvider · ThemeProvider · LanguageProvider
├── services/
│   ├── apiFetch.ts     # fetch wrapper — auto-refresh on 401, redirect to /login on expiry
│   ├── auth/           # authService — bcrypt verify, JWT sign/refresh
│   └── tmdb/           # TMDB client — movies, series, search
├── store/              # themeStore · languageStore · userStore · watchedStore · ratingsStore · toastStore
└── utils/              # formatDate · formatNumber · exportData · getTMDBImageUrl · ...
cypress/
├── e2e/                # auth · movies · users test suites
├── fixtures/           # mocked TMDB responses
└── support/            # commands.ts (cy.login) · e2e.ts (global hooks)
scripts/
├── seed.ts             # Creates an admin user (local dev)
└── docker-seed.js      # Creates admin user on first Docker run (CommonJS, no TS)
data/
└── popcorn.db          # SQLite database — gitignored, auto-created on first run
Dockerfile              # Multi-stage build: deps → builder → runner (Node 20 Alpine)
docker-compose.yml      # Compose with persistent volume for the database
docker-entrypoint.sh    # Seeds DB if absent, then starts the app
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
| CI | GitHub Actions — tsc, lint, jest, build + Cypress E2E on every push |
| Docker | Multi-stage image (Node 20 Alpine, ~200 MB via standalone output) — non-root user, healthcheck, auto-seeds DB on first run; published to ghcr.io on `main` |

---

## Git workflow

```
feature → dev → main
```

- Feature branches are always cut from `dev`
- Before a PR: `npm test` + `tsc --noEmit` + `npm run lint` must all pass
- After merging to `dev`: run build-check — only then merge `dev` into `main`
- `main` is always stable and production-ready
