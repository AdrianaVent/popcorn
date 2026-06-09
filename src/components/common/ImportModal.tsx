'use client'

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import ModalFooter from '@/components/ui/ModalFooter'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'
import { UploadIcon, XIcon, CheckIcon, DownloadIcon } from '@/components/icons'
import { exportAsJSON, exportAsCSV } from '@/utils/exportData'
import { parseJSON, parseCSV } from '@/utils/importUtils'

type Phase = 'upload' | 'results'

export type ImportRow = Record<string, string>

export type ImportFailedRow = {
  index: number
  identifier: string
  code: string
  fields?: string[]
}

export type ImportResult = {
  created: number
  failed: ImportFailedRow[]
}

type Props = {
  title: string
  resultsTitle: string
  description: string
  formatTitle: string
  formatHint: React.ReactNode
  identifierLabel: string
  translateError: (code: string, fields?: string[]) => string
  onProcess: (rows: ImportRow[]) => Promise<ImportResult>
  onClose: () => void
  onDone?: () => void
  failedFilenameBase?: string
}


export default function ImportModal({
  title,
  resultsTitle,
  description,
  formatTitle,
  formatHint,
  identifierLabel,
  translateError,
  onProcess,
  onClose,
  onDone,
  failedFilenameBase = 'import-failed',
}: Props) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<Phase>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  const fileFormat = file?.name.endsWith('.json') ? 'json' : 'csv'

  const clearFile = () => {
    setFile(null)
    setParseError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleProcess = async () => {
    if (!file) {
      setParseError(t('users.import.noFile'))
      return
    }
    setLoading(true)
    setParseError(null)

    try {
      const content = await file.text()
      const rows = fileFormat === 'json' ? parseJSON(content) : parseCSV(content)
      const res = await onProcess(rows)
      setResult(res)
      setPhase('results')
      if (res.created > 0) onDone?.()
    } catch {
      setParseError(t('users.errors.IMPORT_PARSE_ERROR'))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFailed = () => {
    if (!result) return
    const rows = result.failed.map((r) => ({
      row: r.index,
      identifier: r.identifier,
      reason: translateError(r.code, r.fields),
    }))
    if (fileFormat === 'json') {
      exportAsJSON(rows, `${failedFilenameBase}.json`)
    } else {
      exportAsCSV(rows, ['row', 'identifier', 'reason'], `${failedFilenameBase}.csv`, [
        t('users.import.results.colRow'),
        identifierLabel,
        t('users.import.results.colReason'),
      ])
    }
  }

  const uploadFooter = (
    <ModalFooter>
      <Button type="button" variant="secondary" icon={<XIcon size={14} />} hideIconBelow="sm" onClick={onClose} className="w-auto px-4">
        {t('button.cancel')}
      </Button>
      <Button
        type="button"
        icon={<UploadIcon size={14} />}
        hideIconBelow="sm"
        loading={loading}
        onClick={handleProcess}
        className="w-auto px-4"
      >
        {t('users.import.process')}
      </Button>
    </ModalFooter>
  )

  const resultsFooter = (
    <ModalFooter>
      {result && result.failed.length > 0 && (
        <Button type="button" variant="secondary" icon={<DownloadIcon size={14} />} hideIconBelow="sm" onClick={handleDownloadFailed} className="w-auto px-4">
          {t('users.import.results.downloadFailed')}
        </Button>
      )}
      <Button type="button" icon={<CheckIcon size={14} />} hideIconBelow="sm" onClick={onClose} className="w-auto px-4">
        {t('button.accept')}
      </Button>
    </ModalFooter>
  )

  return (
    <Modal
      title={phase === 'upload' ? title : resultsTitle}
      onClose={onClose}
      maxWidth="34rem"
      dismissOnOverlayClick={false}
      footer={phase === 'upload' ? uploadFooter : resultsFooter}
    >
      {phase === 'upload' && (
        <div className="flex flex-col gap-4">
          <Text variant="small" className="text-muted-foreground">
            {description}
          </Text>

          <div className="relative">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 w-full py-8 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hc:hover:border-primary hover:bg-muted/30 hc:hover:bg-muted transition-colors cursor-pointer"
            >
              <span aria-hidden="true"><UploadIcon size={24} color="var(--color-muted-foreground)" /></span>
              {file ? (
                <>
                  <span className="text-[13px] font-medium text-primary">{file.name}</span>
                  <Text variant="caption" className="text-muted-foreground">{t('users.import.replaceFile')}</Text>
                </>
              ) : (
                <Text variant="small" className="text-muted-foreground">{t('users.import.dropzone')}</Text>
              )}
            </button>
            {file && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearFile() }}
                className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={t('button.cancel')}
              >
                <span aria-hidden="true"><XIcon size={14} /></span>
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".json,.csv"
            aria-hidden="true"
            className="hidden"
            onChange={(e) => {
              setParseError(null)
              setFile(e.target.files?.[0] ?? null)
            }}
          />

          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 bg-muted/50 hc:bg-muted border-b border-border">
              <Text variant="caption" className="font-semibold text-foreground">{formatTitle}</Text>
            </div>
            <div className="px-3 py-3 font-mono bg-card text-[11px]">
              {formatHint}
            </div>
          </div>

          {parseError && (
            <Text variant="caption" className="text-destructive">{parseError}</Text>
          )}
        </div>
      )}

      {phase === 'results' && result && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="shrink-0 w-5 h-5 rounded-full bg-green-500/15 hc:bg-transparent hc:border hc:border-green-500 flex items-center justify-center">
              <span className="text-green-500"><CheckIcon size={12} /></span>
            </span>
            <Text variant="small" className="text-foreground">
              {result.created > 0
                ? t('users.import.results.success', { count: result.created })
                : t('users.import.results.noneCreated')}
            </Text>
          </div>

          {result.failed.length > 0 && (
            <div className="flex flex-col gap-2">
              <Text variant="small" className="text-destructive font-medium">
                {t('users.import.results.failed', { count: result.failed.length })}
              </Text>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/40 hc:bg-muted border-b border-border">
                      <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-14">
                        {t('users.import.results.colRow')}
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {identifierLabel}
                      </th>
                      <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('users.import.results.colReason')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.failed.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hc:border-border last:border-0">
                        <td className="px-3 py-2 text-muted-foreground text-center">{row.index}</td>
                        <td className="px-3 py-2 font-medium text-foreground">{row.identifier}</td>
                        <td className="px-3 py-2 text-destructive text-[12px]">{translateError(row.code, row.fields)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
