# Popcorn

Personal movie & series dashboard. Project is in scaffolding phase — infrastructure is ready, no features implemented yet.

## Stack

- **Next.js 16** + React 19 (App Router)
- **TypeScript 5** — path alias `@/*` → `src/*`
- **Tailwind CSS 4** + PostCSS
- **Zustand 5** — global state with localStorage persistence
- **i18next** + react-i18next — ES/EN internationalization
- **ESLint 9** + Prettier — no semicolons, single quotes

## Structure

```
src/
├── app/           # Pages (App Router)
├── components/    # Text (polymorphic), ThemeSwitcher, LanguageSwitcher
├── config/        # i18n setup
├── features/      # EMPTY — feature modules go here
├── hooks/         # useTranslation
├── layouts/       # EMPTY
├── locales/       # en.json, es.json
├── providers/     # GlobalProvider, ThemeProvider, LanguageProvider (client)
├── services/      # EMPTY — external API integrations go here
├── store/         # themeStore, languageStore
├── styles/
│   └── theme/     # colors.ts, light.ts, dark.ts, resolveTheme.ts
├── types/         # TypeScript types
└── utils/         # EMPTY
```

## Design decisions

- **Auto theme**: resolves light (7am–7pm) vs dark based on time of day — see `resolveTheme.ts`
- **Theme applied**: inline styles on provider wrapper, not CSS classes
- **State**: separate stores per domain (theme, language), not a unified store
- **PWA**: manifest + favicons configured in root layout

## Conventions

- New features go in `src/features/`
- External API calls go in `src/services/`
- Reusable components go in `src/components/`
- Follow the client provider pattern for global state
