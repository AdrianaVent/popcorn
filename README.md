# Popcorn 🍿

Personal movie & series dashboard. Track what you watch, discover new titles.

## Tech Stack

- **Next.js 16** + React 19 (App Router)
- **TypeScript 5** — path alias `@/*` → `src/*`
- **Tailwind CSS 4** + PostCSS
- **Zustand 5** — state management (theme & language)
- **i18next** + react-i18next — ES/EN internationalization
- **jose** — JWT utilities (Edge Runtime compatible)
- **ESLint 9** + Prettier — no semicolons, single quotes

## Getting started

```bash
npm install
cp .env.local.example .env.local  # add your TMDB API key
npm run dev   # http://localhost:3000
```

```bash
npm run build       # production build
npm run lint        # check code
npm run lint:fix    # auto-fix
npm run format      # prettier
```

## Features

#### Theme
- Light, dark, and auto modes (auto resolves by time of day: light 7am–7pm)
- Managed with Zustand, persisted in localStorage
- Switched dynamically via `ThemeSwitcher`

#### Language
- English / Spanish — auto-detects browser language on first visit
- State persisted with Zustand, synced to i18n via `onRehydrateStorage`
- Dynamic switching via `LanguageSwitcher`

#### Authentication
- Login UI with skeleton loading, field validation and i18n error messages
- Route protection via Next.js middleware (`src/middleware.ts`)
- HttpOnly cookie-based sessions — `token` (1h) + `refresh_token` (7d)
- Login, logout and refresh via Route Handlers (`src/app/api/auth/`)
- Auth logic isolated in `src/services/auth/` (DummyJSON as mock provider)

#### Movie & Series Data
- Powered by [TMDB API](https://developer.themoviedb.org/) — used strictly as a data provider
- Service layer in `src/services/tmdb/` (movies, series, search)

#### PWA
- Favicons in `/public/icons/`, manifest at `/public/manifest.json`

## Project Structure

```
src/
├── app/
│   ├── api/auth/          # login / logout / refresh — Route Handlers (thin)
│   ├── login/             # Login page (ssr: false via dynamic import)
│   └── page.tsx           # Home (temporary auth demo — will become dashboard)
├── components/
│   ├── common/            # ThemeSwitcher, LanguageSwitcher
│   ├── layouts/           # AuthLayout
│   └── ui/                # Button, Input, Text (polymorphic), LoginSkeleton
├── config/                # Constants split by domain (auth, i18n, constants)
├── features/
│   └── auth/login/        # LoginFeature, LoginForm, useLogin, login.service.ts
├── hooks/                 # useTranslation
├── locales/               # en.json, es.json — auth.errors, auth.success, tmdb.errors, login.*
├── middleware.ts          # Route protection (skips /api/*)
├── providers/             # GlobalProvider, ThemeProvider, LanguageProvider
├── services/
│   ├── auth/              # DummyJSON client — login(), refresh()
│   └── tmdb/              # TMDB client — movies, series, search
├── store/                 # themeStore, languageStore
├── styles/
│   ├── theme/             # colors.ts, light.ts, dark.ts, resolveTheme.ts
│   └── typography.ts      # textStyles (size + lineHeight per variant)
├── types/                 # tmdb.ts, languageTypes.ts
└── utils/
    └── tmdb.ts            # getTMDBImageUrl(path, size)
```

## Architecture Decisions

- **API separation**: `src/app/api/` holds Route Handlers; `src/services/` holds all external API clients. Route Handlers are thin — business logic lives in services.
- **Auth**: Two HttpOnly cookies — `token` (1h) and `refresh_token` (7d). Set on login, both cleared on logout or failed refresh.
- **Auth provider**: DummyJSON (`dummyjson.com/auth`). Login field accepts username (not email). Test credentials: `emilys` / `emilyspass`.
- **TMDB**: Strictly a data provider. Never used for user authentication.
- **Error codes**: API responses return `{ code: string }` — never hardcoded text. Frontend translates via i18next.
- **Auto theme**: resolves light (7am–7pm) vs dark based on time of day — see `resolveTheme.ts`.
- **Theme applied**: inline styles on provider wrapper, not CSS classes. All values in rem.
- **State**: separate Zustand stores per domain. `partialize` persists only the key field; `merge` recalculates derived state on rehydration.
- **SSR / hydration**: features using i18n or theme use `dynamic(..., { ssr: false })` to avoid server/client mismatches. Other pages use a `mounted` guard.
- **Middleware**: skips all `/api/*` routes. Redirects unauthenticated users to `/login`; redirects authenticated users away from auth routes to `/`.
- **PWA**: manifest + favicons configured in root layout.

## Conventions

- New features go in `src/features/`
- External API clients go in `src/services/`
- Route Handlers go in `src/app/api/` and must stay thin
- UI primitives go in `src/components/ui/`, layout wrappers in `src/components/layouts/`, shared non-UI in `src/components/common/`
- Constants split by domain in `src/config/`
- API responses always return `{ code: string }`, never hardcoded messages
- All style values in rem — no px
- Inline styles only — no Tailwind utility classes inside components
- Follow the client provider pattern for global state
