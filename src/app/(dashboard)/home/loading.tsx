'use client'

import { useTranslation } from 'react-i18next'
import Header from '@/components/ui/Header'
import { HomeIcon } from '@/components/icons'

export default function Loading() {
  const { t } = useTranslation()

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <Header title={t('nav.home')} start={<HomeIcon size={32} strokeWidth={1.5} />} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 auto-rows-[50vh] lg:auto-rows-[calc(50vh-3.5rem)]">

          {/* Top 10 skeleton */}
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-4 w-16 rounded bg-border animate-pulse" />
                <div className="h-6 w-16 rounded-lg bg-border animate-pulse" />
              </div>
              <div className="h-6 w-28 rounded bg-border animate-pulse" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1">
                  <div className="w-5 h-3 rounded animate-pulse bg-border shrink-0" />
                  <div className="w-9 h-14 rounded animate-pulse bg-border shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-2.5 rounded animate-pulse bg-border w-4/5" />
                    <div className="h-2 rounded animate-pulse bg-border w-2/5" />
                  </div>
                  <div className="w-8 h-3 rounded animate-pulse bg-border shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Calendar skeleton */}
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 rounded bg-border animate-pulse" />
                <div className="h-6 w-16 rounded-lg bg-border animate-pulse" />
              </div>
              <div className="h-6 w-28 rounded bg-border animate-pulse" />
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-border animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 flex-1" style={{ gridTemplateRows: 'repeat(5, 1fr)' }}>
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="rounded-md bg-border animate-pulse" />
              ))}
            </div>
          </div>

          {/* Genres skeleton */}
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-4 w-16 rounded bg-border animate-pulse" />
                <div className="h-6 w-16 rounded-lg bg-border animate-pulse" />
              </div>
              <div className="h-6 w-28 rounded bg-border animate-pulse" />
            </div>
            <div className="flex flex-1 items-center gap-2 min-h-0">
              <div className="flex-1 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full animate-pulse bg-border" />
              </div>
              <div className="flex flex-col gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-1.5 py-1">
                    <div className="w-2 h-2 rounded-full animate-pulse bg-border shrink-0" />
                    <div className="w-3.5 h-3.5 rounded animate-pulse bg-border shrink-0" />
                    <div className="w-16 h-2.5 rounded animate-pulse bg-border" />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
