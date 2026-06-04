'use client'

import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/themeStore'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
import Modal from '@/components/ui/Modal'
import clsx from 'clsx'
import type { ThemeMode } from '@/styles/theme'
import type { Language } from '@/store/languageStore'
import { SunIcon, MoonIcon, ClockIcon, ContrastIcon } from '@/components/icons'
import type { ReactNode } from 'react'

type SettingsModalProps = {
  onClose: () => void
}

const REGIONS: { code: string; labelKey: string }[] = [
  { code: 'ES', labelKey: 'settings.regions.ES' },
  { code: 'US', labelKey: 'settings.regions.US' },
]

const THEME_ICONS: Record<ThemeMode, ReactNode> = {
  'light':         <SunIcon size={13} strokeWidth={2} />,
  'dark':          <MoonIcon size={13} strokeWidth={2} />,
  'auto':          <ClockIcon size={13} strokeWidth={2} />,
  'high-contrast': <ContrastIcon size={13} strokeWidth={2} />,
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t } = useTranslation()
  const { mode, setMode } = useThemeStore()
  const { language, setLanguage, region, setRegion } = useLanguageStore()
  const userId = useUserStore((s) => s.userId)

  const themeModes: { key: ThemeMode; labelKey: string }[] = [
    { key: 'light',         labelKey: 'settings.themeLight' },
    { key: 'dark',          labelKey: 'settings.themeDark' },
    { key: 'auto',          labelKey: 'settings.themeAuto' },
    { key: 'high-contrast', labelKey: 'settings.themeHighContrast' },
  ]

  const languages: { key: Language; label: string }[] = [
    { key: 'es', label: 'Español' },
    { key: 'en', label: 'English' },
  ]

  const sectionTitle =
    'text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'

  const optionBase =
    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-small cursor-pointer transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset'

  const optionActive = 'bg-primary text-primary-foreground shadow-sm'

  const optionInactive =
    'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 hc:hover:bg-muted'

  const container = 'flex gap-1 p-1 border border-border rounded-lg bg-card'

  return (
    <Modal title={t('settings.title')} onClose={onClose}>
      <div className="flex flex-col gap-6">

        {/* LANGUAGE */}
        <div className="flex flex-col gap-2.5">
          <p id="settings-lang-label" className={sectionTitle}>{t('settings.language')}</p>
          <div role="group" aria-labelledby="settings-lang-label" className={container}>
            {languages.map(({ key, label }) => (
              <button
                key={key}
                aria-pressed={language === key}
                onClick={() => setLanguage(key, userId ?? undefined)}
                className={clsx(optionBase, language === key ? optionActive : optionInactive)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* REGION */}
        <div className="flex flex-col gap-2.5">
          <p id="settings-region-label" className={sectionTitle}>{t('settings.region')}</p>
          <div role="group" aria-labelledby="settings-region-label" className={container}>
            {REGIONS.map(({ code, labelKey }) => (
              <button
                key={code}
                aria-pressed={region === code}
                onClick={() => setRegion(code, userId ?? undefined)}
                className={clsx(optionBase, region === code ? optionActive : optionInactive)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* THEME */}
        <div className="flex flex-col gap-2.5">
          <p id="settings-theme-label" className={sectionTitle}>{t('settings.theme')}</p>
          <div role="group" aria-labelledby="settings-theme-label" className={container}>
            {themeModes.map(({ key, labelKey }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                aria-pressed={mode === key}
                className={clsx(optionBase, mode === key ? optionActive : optionInactive)}
              >
                <span aria-hidden="true">{THEME_ICONS[key]}</span>
                <span>{t(labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  )
}
