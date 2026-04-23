'use client'

import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import Text from '@/components/ui/Text'

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
        <Text variant="title" as="h1" className="mb-2">{t('series.title')}</Text>
        <Text variant="small" className="text-muted-foreground">{t('series.comingSoon')}</Text>
      </div>
    </DashboardLayout>
  )
}
