'use client'

import PageSkeleton from '@/components/ui/PageSkeleton'
import ExportButton from '@/components/common/ExportButton'

export default function Loading() {
  return (
    <PageSkeleton
      titleKey="series.title"
      headerEnd={<ExportButton disabled />}
      hasImage
      cols={7}
    />
  )
}
