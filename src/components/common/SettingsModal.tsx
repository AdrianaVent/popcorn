'use client'

import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/themeStore'
import { useLanguageStore } from '@/store/languageStore'
import { useUserStore } from '@/store/userStore'
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
  const userId = useUserStore((s) => s.userId)

  const themeModes: { key: ThemeMode; labelKey: string }[] = [
    { key: 'light', labelKey: 'settings.themeLight' },
    { key: 'dark', labelKey: 'settings.themeDark' },
    { key: 'auto', labelKey: 'settings.themeAuto' },
  ]

  const languages: { key: Language; label: string }[] = [
    { key: 'en', label: 'English' },
    { key: 'es', label: 'Español' },
  ]

  const sectionTitle =
    'text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground'

  const optionBase =
    'flex-1 py-2 rounded-md text-small cursor-pointer transition-all duration-150'

  const optionActive =
    'bg-primary text-primary-foreground shadow-sm'

  const optionInactive =
    'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'

  const container =
    'flex gap-1 p-1 border border-border rounded-lg bg-card'

  return (
    <Modal title={t('settings.title')} onClose={onClose}>
      <div className="flex flex-col gap-6">

        {/* LANGUAGE */}
        <div className="flex flex-col gap-2.5">
          <p className={sectionTitle}>
            {t('settings.language')}
          </p>

          <div className={container}>
            {languages.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setLanguage(key, userId ?? undefined)}
                className={clsx(
                  optionBase,
                  language === key ? optionActive : optionInactive
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* THEME */}
        <div className="flex flex-col gap-2.5">
          <p className={sectionTitle}>
            {t('settings.theme')}
          </p>

          <div className={container}>
            {themeModes.map(({ key, labelKey }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={clsx(
                  optionBase,
                  mode === key ? optionActive : optionInactive
                )}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  )
}