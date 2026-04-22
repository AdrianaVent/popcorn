'use client'

import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'

export default function SeriesFeature() {
  const { t } = useTranslation()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <DashboardLayout activeNav="series" onLogout={handleLogout}>
      <div className="p-8">
        <h1 className="text-title font-bold text-foreground mb-2">{t('series.title')}</h1>
        <p className="text-small text-muted-foreground">{t('series.comingSoon')}</p>
      </div>
    </DashboardLayout>
  )
}
