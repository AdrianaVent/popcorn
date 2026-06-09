import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '@/store/languageStore'
import { useToastStore } from '@/store/toastStore'
import { fetchUsers } from '@/features/users/users.service'
import { exportAsJSON, exportAsCSV } from '@/utils/exportData'
import { formatShortDate } from '@/utils/formatDate'

export function useUserExport() {
  const { t }        = useTranslation()
  const { language } = useLanguageStore()
  const addToast     = useToastStore((s) => s.addToast)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true)
    try {
      const allData   = await fetchUsers(1, {}, 9999)
      const creators  = new Map(allData.creators.map((c) => [c.id, c.username]))
      const date      = new Date().toISOString().split('T')[0]

      if (format === 'json') {
        exportAsJSON(allData.users.map((u) => ({
          username:   u.username,
          role:       u.role,
          created_at: u.created_at ? new Date(u.created_at).toISOString() : null,
          created_by: u.created_by ? (creators.get(u.created_by) ?? u.created_by) : null,
        })), `users-${date}.json`)
      } else {
        exportAsCSV(allData.users.map((u) => ({
          username:   u.username,
          role:       u.role,
          created_at: u.created_at ? formatShortDate(new Date(u.created_at).toISOString(), language) : '',
          created_by: u.created_by ? (creators.get(u.created_by) ?? '') : '',
        })), ['username', 'role', 'created_at', 'created_by'], `users-${date}.csv`, [
          t('users.columns.username'), t('users.columns.role'),
          t('users.columns.createdAt'), t('users.columns.createdBy'),
        ])
      }
      addToast('success', t('export.success'))
    } catch {
      addToast('error', t('export.error'))
    } finally {
      setIsExporting(false)
    }
  }

  return { isExporting, handleExport }
}
