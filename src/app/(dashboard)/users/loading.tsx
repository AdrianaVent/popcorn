'use client'

import { useTranslation } from 'react-i18next'
import PageSkeleton from '@/components/ui/PageSkeleton'
import ExportButton from '@/components/common/ExportButton'
import IconButton from '@/components/ui/IconButton'
import { PlusCircleIcon, UploadIcon } from '@/components/icons'

export default function Loading() {
  const { t } = useTranslation()
  return (
    <PageSkeleton
      titleKey="users.title"
      headerEnd={
        <div className="flex items-center gap-2">
          <ExportButton disabled />
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UploadIcon size={15} />
            <span className="hidden md:inline">{t('users.import.button')}</span>
          </button>
          <IconButton
            icon={<PlusCircleIcon size={15} />}
            label={t('users.addUser')}
            disabled
          />
        </div>
      }
      hasImage={false}
      cols={5}
    />
  )
}
