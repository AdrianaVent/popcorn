'use client'

import { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Text from '@/components/ui/Text'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import { useUserStore } from '@/store/userStore'
import GuestStats from './stats/GuestStats'
import AdminStats from './stats/AdminStats'
import type { StatTab } from './stats/statsCard.types'

export { buildRatingHistogram, buildDecadeDistribution } from './stats/statsCard.utils'

export default function StatsCard({ className = '' }: { className?: string }) {
  const { t }   = useTranslation()
  const role    = useUserStore((s) => s.role)
  const [tab, setTab] = useState<StatTab>('activity')
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>('light')

  useLayoutEffect(() => {
    const check = () => {
      const attr = document.documentElement.getAttribute('data-theme')
      setTheme(attr === 'dark' ? 'dark' : attr === 'high-contrast' ? 'high-contrast' : 'light')
    }
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  const barColor   = theme === 'dark' ? '#F5E6C8' : theme === 'high-contrast' ? '#712F24' : '#8E3B2E'
  const mutedColor = theme === 'dark' ? '#D1D5DB' : theme === 'high-contrast' ? '#6B7280' : '#9CA3AF'

  return (
    <div data-cy="stats-card" className={`flex flex-col gap-3 rounded-xl border border-border bg-card p-3 select-none [&_svg]:outline-none [&_svg_*]:outline-none${className ? ` ${className}` : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <Text variant="body" className="font-semibold text-foreground">
          {role === 'admin' ? t('dashboard.stats.titleAdmin') : t('dashboard.stats.titleGuest')}
        </Text>
        {role === 'guest' && (
          <ToggleSwitch
            options={[
              { value: 'activity', label: t('dashboard.stats.tab.activity') },
              { value: 'insights', label: t('dashboard.stats.tab.insights') },
            ]}
            value={tab}
            onChange={setTab}
          />
        )}
      </div>
      {role === 'admin'
        ? <AdminStats barColor={barColor} mutedColor={mutedColor} />
        : <GuestStats barColor={barColor} mutedColor={mutedColor} tab={tab} />
      }
    </div>
  )
}
