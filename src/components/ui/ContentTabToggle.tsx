'use client'

import { useTranslation } from 'react-i18next'
import { FilmIcon, TvIcon } from '@/components/icons'
import Tooltip from '@/components/ui/Tooltip'

export type ContentTab = 'movies' | 'series'

type Props = {
  tab: ContentTab
  onTabChange: (tab: ContentTab) => void
}

export default function ContentTabToggle({ tab, onTabChange }: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
      <Tooltip content={t('nav.movies')} placement="bottom">
        <button
          type="button"
          aria-label={t('nav.movies')}
          aria-pressed={tab === 'movies'}
          onClick={() => onTabChange('movies')}
          className={`p-1 rounded transition-colors ${
            tab === 'movies'
              ? 'bg-primary/20 text-primary hc:bg-primary hc:text-primary-foreground'
              : 'text-muted-foreground hover:bg-card/70 hover:text-foreground hc:hover:bg-muted'
          }`}
        >
          <span aria-hidden="true"><FilmIcon size={14} /></span>
        </button>
      </Tooltip>
      <Tooltip content={t('nav.series')} placement="bottom">
        <button
          type="button"
          aria-label={t('nav.series')}
          aria-pressed={tab === 'series'}
          onClick={() => onTabChange('series')}
          className={`p-1 rounded transition-colors ${
            tab === 'series'
              ? 'bg-primary/20 text-primary hc:bg-primary hc:text-primary-foreground'
              : 'text-muted-foreground hover:bg-card/70 hover:text-foreground hc:hover:bg-muted'
          }`}
        >
          <span aria-hidden="true"><TvIcon size={14} /></span>
        </button>
      </Tooltip>
    </div>
  )
}
