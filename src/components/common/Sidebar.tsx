'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { GridIcon, FilmIcon, TvIcon, GearIcon, MenuIcon } from '@/components/icons'
import SettingsModal from './SettingsModal'
import Image from 'next/image'

type NavItem = {
  key: string
  labelKey: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
}

type SidebarProps = {
  activeKey?: string
}

export default function Sidebar({ activeKey = 'dashboard' }: SidebarProps) {
  const { t } = useTranslation()

  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [tooltipY, setTooltipY] = useState(0)

  /* ─── Auto collapse (iPad / tablet) ─── */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)') // lg breakpoint

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setCollapsed(e.matches)
    }

    handleChange(mq)
    mq.addEventListener('change', handleChange)

    return () => mq.removeEventListener('change', handleChange)
  }, [])

  const navItems: NavItem[] = [
    { key: 'dashboard', labelKey: 'nav.dashboard', icon: <GridIcon size={16} />, href: '/dashboard' },
    { key: 'movies',    labelKey: 'nav.movies',    icon: <FilmIcon size={16} />, href: '/movies' },
    { key: 'series',    labelKey: 'nav.series',    icon: <TvIcon size={16} />,   href: '/series' },
    { key: 'settings',  labelKey: 'nav.settings',  icon: <GearIcon size={16} />, onClick: () => setSettingsOpen(true) },
  ]

  const handleMouseEnter = (key: string, e: React.MouseEvent) => {
    if (!collapsed) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltipY(rect.top + rect.height / 2)
    setHoveredKey(key)
  }

  const itemClass = (isActive: boolean) =>
    clsx(
      'flex items-center gap-2 px-3 py-2 rounded-lg text-small cursor-pointer w-full border-0 text-left transition-colors',
      isActive
        ? 'bg-primary/10 text-primary font-semibold'
        : 'bg-transparent text-muted-foreground hover:text-foreground'
    )

  return (
    <>
      <aside
        className={clsx(
          'flex flex-col min-h-screen bg-card border-r border-border shrink-0',
          'transition-all duration-200 ease-in-out',
          collapsed ? 'w-16 items-center px-2' : 'w-48 px-3'
        )}
      >
        {/* Header */}
        <div className="h-14 flex items-center px-2 gap-2 border-b border-border overflow-hidden">
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MenuIcon size={16} />
          </button>

          {!collapsed && (
            <div className="ml-2 flex items-center">
              <Image
                src="/icons/popcorn.svg"
                alt="Popcorn"
                width={200}
                height={54}
                className="h-9 w-auto"
              />
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 p-2">
          {navItems.map((item) => {
            const isActive = item.key === activeKey

            const content = (
              <>
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && t(item.labelKey)}
              </>
            )

            return item.onClick ? (
              <button
                key={item.key}
                onClick={item.onClick}
                onMouseEnter={(e) => handleMouseEnter(item.key, e)}
                onMouseLeave={() => setHoveredKey(null)}
                className={itemClass(isActive)}
              >
                {content}
              </button>
            ) : (
              <a
                key={item.key}
                href={item.href}
                onMouseEnter={(e) => handleMouseEnter(item.key, e)}
                onMouseLeave={() => setHoveredKey(null)}
                className={itemClass(isActive)}
              >
                {content}
              </a>
            )
          })}
        </nav>
      </aside>

      {/* Tooltip */}
      {collapsed && hoveredKey && (() => {
        const item = navItems.find((i) => i.key === hoveredKey)
        if (!item) return null

        return (
          <div
            className="fixed z-50 bg-primary text-primary-foreground text-caption font-medium px-2 py-1 rounded-md pointer-events-none whitespace-nowrap shadow-md"
            style={{
              left: '4.5rem',
              top: tooltipY,
              transform: 'translateY(-50%)'
            }}
          >
            {t(item.labelKey)}
          </div>
        )
      })()}

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  )
}