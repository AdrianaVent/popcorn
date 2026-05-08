'use client'

import { useTranslation } from 'react-i18next'
import { LogOutIcon } from '@/components/icons'

type TopbarProps = {
  onLogout?: () => void
}

export default function Topbar({ onLogout }: TopbarProps) {
  const { t } = useTranslation()

  return (
    <header className="h-14 flex items-center justify-end px-6 border-b border-border bg-card">
      <button
        onClick={onLogout}
        aria-label={t('topbar.logout')}
        title={t('topbar.logout')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-transparent text-muted-foreground text-small cursor-pointer transition-colors hover:text-foreground whitespace-nowrap"
        suppressHydrationWarning
      >
        <LogOutIcon size={16} />
        <span className="hidden lg:inline" suppressHydrationWarning>{t('topbar.logout')}</span>
      </button>
    </header>
  )
}
