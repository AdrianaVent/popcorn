'use client'

import { useTranslation } from 'react-i18next'
import ImportModal from '@/components/common/ImportModal'
import { importUsers } from './users.service'
import type { ImportRow } from '@/components/common/ImportModal'

type Props = {
  onClose: () => void
  onDone: () => void
}

function FormatHint() {
  return (
    <div className="flex flex-col gap-3 text-foreground/80 leading-relaxed">
      <div>
        <span className='text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>JSON</span>
        <pre className="mt-1 whitespace-pre-wrap">{`[{
  "username": "john",
  "password": "Admin123!",
  "role": "admin | guest"
}]`}</pre>
      </div>
      <div className="border-t border-border/60 pt-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">CSV</span>
        <pre className="mt-1">{'username,password,role\njohn,Admin123!,guest'}</pre>
      </div>
    </div>
  )
}

export default function ImportUsersModal({ onClose, onDone }: Props) {
  const { t } = useTranslation()

  const handleProcess = async (rows: ImportRow[]) => {
    const result = await importUsers(rows as { username: string; password: string; role: string }[])
    return {
      created: result.created,
      failed: result.failed.map((r) => ({ index: r.index, identifier: r.username, code: r.code, fields: r.fields })),
    }
  }

  const translateError = (code: string, fields?: string[]) => {
    if (code === 'IMPORT_MISSING_FIELDS' && fields?.length) {
      return t('users.errors.IMPORT_MISSING_FIELDS_DETAIL', { fields: fields.join(', ') })
    }
    return t(`users.errors.${code}`, { defaultValue: code })
  }

  return (
    <ImportModal
      title={t('users.import.title')}
      resultsTitle={t('users.import.results.title')}
      description={t('users.import.description')}
      formatTitle={t('users.import.formatTitle')}
      formatHint={<FormatHint />}
      identifierLabel={t('users.columns.username')}
      translateError={translateError}
      onProcess={handleProcess}
      onClose={onClose}
      onDone={onDone}
      failedFilenameBase="import-users-failed"
    />
  )
}
