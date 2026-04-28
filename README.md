# Popcorn 🍿

Personal movie & series dashboard. Track what you watch, discover new titles.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 + React 19 (App Router) |
| Language | TypeScript 5 — path alias `@/*` → `src/*` |
| Styling | Tailwind CSS 4 + PostCSS |
| State | Zustand 5 — persisted in localStorage |
| i18n | i18next + react-i18next — English / Spanish |
| Auth | jose (JWT) · better-sqlite3 · bcryptjs |
| Testing | Jest 30 + Testing Library |
| Linting | ESLint 9 + Prettier — no semicolons, single quotes |

---

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # fill in TMDB_API_KEY and JWT_SECRET
npm run seed                        # creates the default admin user
npm run dev                         # http://localhost:3000
```

Default credentials: `admin` / `Admin123!`

To create an admin with custom credentials:

```bash
npm run seed <username> <password>
```

> Passwords must contain at least 8 characters, one uppercase letter, one number and one special character.

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Run all tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier |
| `npm run seed` | Create default admin user |

---

## Features

### Authentication & Roles

- Self-hosted auth — users stored in local SQLite, passwords hashed with bcrypt
- Two roles: **admin** (full access) and **guest** (limited access)
- JWT sessions: `token` (1h) + `refresh_token` (7d), both HttpOnly cookies
- Route protection via Next.js middleware — JWT verified on every request

| Capability | Admin | Guest |
|---|---|---|
| Browse movies & series | ✓ | ✓ |
| Mark as watched | ✓ | ✓ |
| Export data (JSON / CSV) | ✓ | — |
| Manage users | ✓ | — |

### Movies & Series

- Paginated lists — title search, rating, year and language filters
- Detail modal — poster, metadata, genres, tagline, collection/saga
- Watched tracking per user, persisted locally
- Export all pages to JSON or CSV with formatted values (admin only)

### User Management

- Admin-only — guests cannot access this section (middleware redirect)
- Create, edit and delete users with role assignment (admin / guest)
- Password validation on submit (min 8 chars, uppercase, number, special character)
- Filters: username, role, creation date, created by
- Bulk selection and bulk delete with confirmation modal
- Self-edit protection — admins cannot delete or demote their own account

### Theme & Language

- Light / dark / auto modes — auto resolves by time of day (7am–7pm)
- English / Spanish — browser language auto-detected on first visit
- Both settings persisted in localStorage, switchable from the Settings modal

---

## Project Structure

```
src/
├── app/api/auth/       # login · logout · refresh — thin Route Handlers
├── components/
│   ├── common/         # FiltersPanel, ExportButton, Sidebar, SettingsModal, ...
│   ├── layouts/        # AuthLayout, DashboardLayout
│   └── ui/             # Button, Input, Text, Modal, ModalFooter, Header,
│                       # DatePicker, ConfirmModal, IconButton, Table/, LoadingOverlay, ...
├── config/             # auth.ts · tmdb.ts · i18n.ts · constants.ts
├── db/                 # client.ts (SQLite singleton) · users.ts (typed queries)
├── features/
│   ├── auth/login/     # LoginFeature · useLogin · login.service.ts
│   ├── movies/         # MoviesFeature · hooks · components · service
│   ├── series/         # SeriesFeature · hooks · components · service
│   └── users/          # UsersFeature · UserFormModal · users.service.ts
├── hooks/              # useAsync · useFilters
├── locales/            # en.json · es.json
├── middleware.ts        # JWT verification + route protection
├── providers/          # GlobalProvider · ThemeProvider · LanguageProvider
├── services/
│   ├── auth/           # authService — bcrypt verify, JWT sign/refresh
│   └── tmdb/           # TMDB client — movies, series, search
├── store/              # themeStore · languageStore · userStore · watchedStore
└── utils/              # formatDate · formatNumber · exportData · getTMDBImageUrl · ...
scripts/
└── seed.ts             # Creates an admin user
data/
└── popcorn.db          # SQLite database — gitignored
```

---

## Git Workflow

```
feature → dev → main
```

- Feature branches are always cut from `dev`
- Before a PR: `npm test` + `tsc --noEmit` + `npm run lint` must all pass
- After merging to `dev`: run build-check — only then merge `dev` into `main`
- `main` is always stable and production-ready
- All merges and branch deletions require explicit user authorization
