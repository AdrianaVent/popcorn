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
#### Favicons & Manifest
- Favicons located in `/public/icons/`
- Manifest: `/public/manifest.json` ready for PWA
- Favicon types included: `.ico`, `.png`, `.svg`

## Tech stack

- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **ESLint + Prettier** for consistent code style
- **Zustand** for state management (theme & language)
- **i18next** for translations (multi-language support)

## Installation

```bash
git clone <your-repo-url>
cd popcorn
npm install

npm run dev         # development mode
npm run lint        # check code
npm run lint:fix    # auto-fix lint issues
npm run format      # format code with Prettier
