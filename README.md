# Popcorn 🍿

Personal project focused on building a modern movie & series dashboard with Next.js and TypeScript.

## Features

#### Theme
- Global theme support: Light, Dark, and Auto modes
- Theme managed with Zustand
- Theme persists in localStorage
- Theme can be switched dynamically via `ThemeSwitcher` component

#### Language Management
- English / Spanish
- Uses **i18next** with JSON files in `src/locales/`
- State persisted with Zustand
- Dynamic switching via `LanguageSwitcher` component
- Translation hook: `useTranslation()`

#### Authentication
- Route protection via Next.js middleware (`src/middleware.ts`)
- HttpOnly cookie-based sessions (`token`)
- Login and logout via internal Route Handlers (`src/app/api/auth/`)
- Auth logic (DummyJSON calls) isolated in `src/services/auth/`

#### Movie & Series Data
- Powered by [TMDB API](https://developer.themoviedb.org/) — used strictly as a data provider
- Service layer in `src/services/tmdb/` (movies, series, search)

#### Favicons & Manifest
- Favicons located in `/public/icons/`
- Manifest: `/public/manifest.json` ready for PWA
- Favicon types included: `.ico`, `.png`, `.svg`

## Tech Stack

- **Next.js 16** + React 19 (App Router)
- **TypeScript 5** — path alias `@/*` → `src/*`
- **Tailwind CSS 4** + PostCSS
- **Zustand 5** — state management (theme & language)
- **i18next** + react-i18next — ES/EN internationalization
- **jose** — JWT utilities (Edge Runtime compatible)
- **ESLint 9** + Prettier — no semicolons, single quotes

## Project Structure

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
├── providers/             # GlobalProvider, ThemeProvider, LanguageProvider
├── services/              # All external API clients
│   ├── tmdb/              # TMDB client (movies, series, search)
│   └── auth/              # DummyJSON auth client
├── store/                 # themeStore, languageStore
├── styles/
│   └── theme/             # colors.ts, light.ts, dark.ts, resolveTheme.ts
├── types/                 # TypeScript types (tmdb.ts, ...)
└── utils/                 # Shared utilities (empty)
```

## Architecture Decisions

- **API separation**: `src/app/api/` holds Route Handlers (framework-required location); `src/services/` holds all external API clients. Route Handlers are thin — business logic lives in services.
- **Auth**: HttpOnly cookies only — no localStorage. Cookie is set on login and deleted (`maxAge: 0`) on logout.
- **TMDB**: Strictly a data provider. Never used for user authentication.
- **Auto theme**: resolves light (7am–7pm) vs dark based on time of day — see `resolveTheme.ts`
- **Theme applied**: inline styles on provider wrapper, not CSS classes
- **State**: separate Zustand stores per domain (theme, language)
- **PWA**: manifest + favicons configured in root layout

## Conventions

- New features go in `src/features/`
- External API clients go in `src/services/`
- Route Handlers go in `src/app/api/` and must stay thin
- Reusable components go in `src/components/`
- Constants are split by domain in `src/config/`
- Follow the client provider pattern for global state

## Installation

```bash
git clone <your-repo-url>
cd popcorn
npm install
cp .env.local.example .env.local  # add your TMDB API key
```

```bash
npm run dev         # development mode
npm run build       # production build
npm run lint        # check code
npm run lint:fix    # auto-fix lint issues
npm run format      # format code with Prettier
```
