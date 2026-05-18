'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import Link from 'next/link'
import { FilmIcon, TvIcon, GearIcon, UsersIcon, HomeIcon, LogOutIcon, ChevronLeftIcon, ChevronRightIcon, BookmarkIcon } from '@/components/icons'
import SettingsModal from './SettingsModal'
import Tooltip from '@/components/ui/Tooltip'
import Image from 'next/image'
import { useUserStore } from '@/store/userStore'
import type { UserRole } from '@/db/users'

type NavItem = {
  key: string
  labelKey: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  adminOnly?: boolean
  guestOnly?: boolean
}

type SidebarProps = {
  activeKey?: string
  serverRole: UserRole | null
  onLogout?: () => void
}

export default function Sidebar({ activeKey = 'dashboard', serverRole, onLogout }: SidebarProps) {
  const { t } = useTranslation()
  const storeRole = useUserStore((s) => s.role)

  // serverRole comes from the JWT cookie (read server-side), so the first render
  // already has the correct value — no flash or layout shift.
  // storeRole takes over on login/logout without a page reload.
  const role = storeRole ?? serverRole

  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  /* ─── Auto collapse (iPad / tablet) ─── */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1024px)')
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => { setCollapsed(e.matches) }
    handleChange(mq)
    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [])

  const navItems: NavItem[] = [
    { key: 'dashboard', labelKey: 'nav.home',     icon: <HomeIcon size={16} />,     href: '/home' },
    { key: 'movies',    labelKey: 'nav.movies',   icon: <FilmIcon size={16} />,     href: '/movies' },
    { key: 'series',    labelKey: 'nav.series',   icon: <TvIcon size={16} />,       href: '/series' },
    { key: 'my-list',   labelKey: 'nav.myList',   icon: <BookmarkIcon size={16} />, href: '/my-list', guestOnly: true },
    { key: 'users',     labelKey: 'nav.users',    icon: <UsersIcon size={16} />,    href: '/users', adminOnly: true },
    { key: 'settings',  labelKey: 'nav.settings', icon: <GearIcon size={16} />,     onClick: () => setSettingsOpen(true) },
  ]

  const itemClass = (isActive: boolean) =>
    clsx(
      'flex items-center gap-2 px-3 py-2 rounded-lg text-small cursor-pointer w-full border-0 text-left transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset',
      isActive
        ? 'bg-primary/10 text-primary font-semibold'
        : 'bg-transparent text-muted-foreground hover:text-foreground'
    )

  return (
    <>
      <aside
        className={clsx(
          'relative flex flex-col min-h-screen bg-card border-r border-border shrink-0',
          'transition-all duration-200 ease-in-out',
          collapsed ? 'w-16 items-center px-2' : 'w-48 px-3'
        )}
      >
        {/* Logo / bucket icon — decorative only */}
        {collapsed ? (
          <div className="flex justify-center w-full py-4">
            <Image src="/icons/bucket-light.svg" alt="Popcorn" width={44} height={44} className="rounded-full dark:hidden" loading="eager" />
            <Image src="/icons/bucket-dark.svg"  alt="Popcorn" width={44} height={44} className="rounded-full hidden dark:block" loading="eager" />
          </div>
        ) : (
          <div className="pt-4 pb-2">
            <Image
              src="/icons/popcorn.svg"
              alt="Popcorn"
              width={200}
              height={54}
              className="w-full h-auto"
              loading="eager"
            />
          </div>
        )}

        {/* Separator + sidebar toggle.
            w-full ensures the wrapper fills the full content area in both states.
            right offset = content-right-to-border-center + half-button:
              expanded (px-3 = 12px): 12 + 13 = 25px → -right-6.5 (26px, ~half-circle)
              collapsed (px-2 = 8px):  8 + 13 = 21px → -right-5.5 (22px, ~half-circle) */}
        <div className="relative flex items-center w-full mb-2">
          <div className="flex-1 border-t border-border" />
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={clsx(
              'absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full',
              'bg-primary text-primary-foreground flex items-center justify-center',
              'shadow-md hover:opacity-90 transition-opacity z-10',
              'outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
              collapsed ? '-right-5.5' : '-right-6.5'
            )}
          >
            {collapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 p-2 pt-1">
          {navItems.map((item) => {
            const isActive = item.key === activeKey
            const isHidden = (item.adminOnly && role !== 'admin') || (item.guestOnly && role === 'admin')

            const content = (
              <>
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span suppressHydrationWarning>{t(item.labelKey)}</span>}
              </>
            )

            if (isHidden) return null

            const label = t(item.labelKey)
            const el = item.onClick ? (
              <button onClick={item.onClick} className={itemClass(isActive)}>
                {content}
              </button>
            ) : (
              <Link href={item.href ?? '/'} className={itemClass(isActive)}>
                {content}
              </Link>
            )

            return (
              <Tooltip key={item.key} content={label} placement="right" disabled={!collapsed} className="w-full">
                {el}
              </Tooltip>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-border">
          <Tooltip content={t('topbar.logout')} placement="right" disabled={!collapsed} className="w-full">
            <button
              onClick={onLogout}
              className={itemClass(false)}
              suppressHydrationWarning
            >
              <span className="shrink-0"><LogOutIcon size={16} /></span>
              {!collapsed && <span suppressHydrationWarning>{t('topbar.logout')}</span>}
            </button>
          </Tooltip>
        </div>
      </aside>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  )
}
