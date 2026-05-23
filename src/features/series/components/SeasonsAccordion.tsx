'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AccordionList from '@/components/ui/AccordionList'
import Text from '@/components/ui/Text'
import SeasonItem from './seasons/SeasonItem'
import { useUserStore } from '@/store/userStore'
import type { StoredSeries } from '@/store/watchedStore'
import type { TMDBSeason } from '@/types/tmdb'

type Props = {
  seasons: TMDBSeason[]
  seriesName: string
  seriesId: number
  seriesSnapshot?: StoredSeries
}

export default function SeasonsAccordion({ seasons, seriesName, seriesId, seriesSnapshot }: Props) {
  const { t } = useTranslation()
  const [openSeasonId, setOpenSeasonId] = useState<number | null>(null)
  const userId = useUserStore((s) => s.userId)
  const role   = useUserStore((s) => s.role)
  const userKey = String(userId ?? 'guest')
  const canWatch = role !== 'admin'

  const allItems = seasons.filter((s) => s.season_number > 0 && s.air_date)

  return (
    <AccordionList
      title={
        <div className="flex items-center gap-2">
          <Text variant="small" className="text-muted-foreground">
            {t('series.detail.seasonsAccordion')}
          </Text>
          <Text variant="small" className="text-foreground font-medium">
            {seriesName}
          </Text>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-background text-muted-foreground border border-border/50">
            {allItems.length}
          </span>
        </div>
      }
      items={allItems}
      renderItem={(season) => (
        <div key={season.id}>
          <SeasonItem
            season={season}
            seriesId={seriesId}
            isOpen={openSeasonId === season.id}
            onToggle={() => setOpenSeasonId((prev) => prev === season.id ? null : season.id)}
            userId={userKey}
            seriesSnapshot={seriesSnapshot}
            canWatch={canWatch}
          />
        </div>
      )}
    />
  )
}
