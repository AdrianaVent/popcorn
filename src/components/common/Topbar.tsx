'use client'

import { useTranslation } from 'react-i18next'
import { SearchIcon, LogOutIcon } from '@/components/icons'

type TopbarProps = {
  onLogout?: () => void
}

export default function Topbar({ onLogout }: TopbarProps) {
  const { t } = useTranslation()

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card gap-4">
      <div className="flex items-center gap-2 flex-1 max-w-96 bg-background border border-border rounded-lg px-3 py-1.5">
        <SearchIcon size={16} color="var(--muted-foreground)" />
        <input
          type="text"
          placeholder={t('topbar.search')}
          className="bg-transparent border-0 outline-none text-foreground text-small w-full placeholder:text-muted-foreground"
        />
      </div>
      <button
        onClick={onLogout}
        aria-label={t('topbar.logout')}
        title={t('topbar.logout')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-transparent text-muted-foreground text-small cursor-pointer transition-colors hover:text-foreground whitespace-nowrap"
      >
        <LogOutIcon size={16} />
        <span className="hidden lg:inline">{t('topbar.logout')}</span>
      </button>
    </header>
  )
}
