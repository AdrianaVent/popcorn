'use client'

import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/themeStore'
import { useLanguageStore } from '@/store/languageStore'
import Modal from '@/components/ui/Modal'
import clsx from 'clsx'
import type { ThemeMode } from '@/styles/theme'
import type { Language } from '@/store/languageStore'

type SettingsModalProps = {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { t } = useTranslation()
  const { mode, setMode } = useThemeStore()
  const { language, setLanguage } = useLanguageStore()

  const themeModes: { key: ThemeMode; labelKey: string }[] = [
    { key: 'light', labelKey: 'settings.themeLight' },
    { key: 'dark',  labelKey: 'settings.themeDark' },
    { key: 'auto',  labelKey: 'settings.themeAuto' },
  ]

  const languages: { key: Language; label: string }[] = [
    { key: 'en', label: 'English' },
    { key: 'es', label: 'Español' },
  ]

  return (
    <Modal title={t('settings.title')} onClose={onClose}>
      {/* Language */}
      <div className="flex flex-col gap-2.5">
        <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wide">
          {t('settings.language')}
        </p>
        <div className="flex gap-1 bg-background border border-border rounded-lg p-1">
          {languages.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setLanguage(key)}
              className={clsx(
                'flex-1 py-1.5 rounded-md border-0 text-small cursor-pointer transition-colors',
                language === key
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-transparent text-muted-foreground font-normal',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="flex flex-col gap-2.5">
        <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wide">
          {t('settings.theme')}
        </p>
        <div className="flex gap-1 bg-background border border-border rounded-lg p-1">
          {themeModes.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={clsx(
                'flex-1 py-1.5 rounded-md border-0 text-small cursor-pointer transition-colors',
                mode === key
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-transparent text-muted-foreground font-normal',
              )}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
