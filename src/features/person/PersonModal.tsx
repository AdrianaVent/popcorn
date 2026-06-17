'use client'

import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Image from 'next/image'
import Modal from '@/components/ui/Modal'
import Text from '@/components/ui/Text'
import MediaPoster from '@/components/common/MediaPoster'
import { usePersonDetail } from '@/features/person/hooks/usePersonDetail'
import { usePersonCredits } from '@/features/person/hooks/usePersonCredits'
import { useWatchedStore } from '@/store/watchedStore'
import { useUserStore } from '@/store/userStore'
import { getTMDBImageUrl } from '@/utils/tmdb'
import type { TMDBPersonCombinedCredit } from '@/types/tmdb'
import { translateCharacter } from '@/utils/translateCharacter'
import { EyeIcon, FilmIcon, TvIcon } from '@/components/icons'

type Props = {
  personId: number
  onClose: () => void
  onCreditClick?: (mediaType: 'movie' | 'tv', id: number) => void
}

type Tab = 'movies' | 'series'

type MergedCredit = TMDBPersonCombinedCredit & {
  role: string
}

export function mergeCredits(
  cast: TMDBPersonCombinedCredit[],
  crew: TMDBPersonCombinedCredit[],
): MergedCredit[] {
  const map = new Map<number, MergedCredit>()

  for (const c of cast) {
    map.set(c.id, { ...c, role: c.character ?? '' })
  }
  for (const c of crew) {
    if (!map.has(c.id)) {
      map.set(c.id, { ...c, role: c.job ?? '' })
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const dateA = a.release_date ?? a.first_air_date ?? ''
    const dateB = b.release_date ?? b.first_air_date ?? ''
    return dateB.localeCompare(dateA)
  })
}

export function getYear(credit: TMDBPersonCombinedCredit): string {
  const date = credit.release_date ?? credit.first_air_date ?? ''
  return date ? date.slice(0, 4) : '—'
}

function ProfilePhoto({ profilePath, name }: { profilePath: string | null; name: string }) {
  const [errored, setErrored] = useState(false)
  const url = getTMDBImageUrl(profilePath, 'w185')

  return (
    <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center shrink-0">
      {url && !errored ? (
        <Image
          src={url}
          alt={name}
          width={80}
          height={80}
          className="object-cover w-full h-full"
          loading="eager"
          onError={() => setErrored(true)}
        />
      ) : (
        <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted-foreground)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      )}
    </div>
  )
}


function CreditRow({
  credit,
  isWatched,
  onClick,
}: {
  credit: MergedCredit
  isWatched: boolean
  onClick?: () => void
}) {
  const { t } = useTranslation()
  const year = getYear(credit)
  const title = credit.title ?? credit.name ?? '—'
  const role = credit.role ? translateCharacter(credit.role, t) : ''

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center gap-3 py-3 border-b border-border/40 last:border-0 text-left rounded-md px-2 -mx-2 transition-colors ${onClick ? 'cursor-pointer hover:bg-cream-400 dark:hover:bg-gray-700/60 hc:hover:bg-muted' : 'cursor-default'}`}
    >
      <div className="shrink-0">
        <MediaPoster
          posterPath={credit.poster_path}
          title={title}
          variant="sm"
          className="rounded"
        />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Text variant="small" className="font-medium text-foreground truncate">
            {title}
          </Text>
          <Text variant="caption" className="text-muted-foreground shrink-0">
            {year}
          </Text>
        </div>
        {role && (
          <Text variant="caption" className="italic text-muted-foreground line-clamp-1">
            {role}
          </Text>
        )}
      </div>
      <div className="shrink-0 w-6 flex items-center justify-center">
        {isWatched && (
          <span
            role="img"
            aria-label={t('common.watched')}
            className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground"
          >
            <EyeIcon size={10} color="currentColor" />
          </span>
        )}
      </div>
    </button>
  )
}

export default function PersonModal({ personId, onClose, onCreditClick }: Props) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('movies')

  const { person, loading: personLoading } = usePersonDetail(personId)
  const { cast, crew, loading: creditsLoading } = usePersonCredits(personId)

  const userId = useUserStore((s) => s.userId)
  const userKey = String(userId ?? 'guest')
  const watchedMovies = useWatchedStore((s) => s.movies[userKey])
  const watchedSeries = useWatchedStore((s) => s.seriesData[userKey])

  const hasPage = (c: TMDBPersonCombinedCredit) => c.id > 0 && c.vote_count > 0

  const movieCredits = mergeCredits(
    cast.filter((c) => c.media_type === 'movie' && hasPage(c)),
    crew.filter((c) => c.media_type === 'movie' && hasPage(c)),
  )
  const seriesCredits = mergeCredits(
    cast.filter((c) => c.media_type === 'tv' && hasPage(c)),
    crew.filter((c) => c.media_type === 'tv' && hasPage(c)),
  )

  const loading = personLoading || creditsLoading
  const currentCredits = tab === 'movies' ? movieCredits : seriesCredits

  const tabButton = (value: Tab, label: string, count: number, icon: ReactNode) => (
    <button
      type="button"
      role="tab"
      id={`person-tab-${value}`}
      aria-selected={tab === value}
      aria-controls="person-tabpanel"
      onClick={() => setTab(value)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-widest transition-colors ${
        tab === value
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
      <span aria-hidden="true" className={`text-[10px] font-medium ${tab === value ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
        {count}
      </span>
    </button>
  )

  return (
    <Modal
      title={person?.name ?? '...'}
      onClose={onClose}
      maxWidth="44rem"
    >
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 rounded-full bg-muted shrink-0" />
            <div className="flex flex-col gap-2 pt-1 flex-1">
              <div className="h-5 bg-muted rounded w-40" />
              <div className="h-3.5 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-2.5 border-b border-border/40">
                <div className="w-10 h-14 bg-muted rounded shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1 pt-0.5">
                  <div className="h-3.5 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && person && (
        <div className="space-y-6">
          {/* PERSON HEADER */}
          <div className="flex gap-4 items-start">
            <ProfilePhoto profilePath={person.profile_path} name={person.name} />
            <div className="flex flex-col gap-1 min-w-0 pt-1">
              <Text variant="subtitle" as="h2" className="text-foreground leading-tight text-[1.2rem]">
                {person.name}
              </Text>
              {person.known_for_department && (
                <Text variant="small" className="text-muted-foreground">
                  {t(`person.department.${person.known_for_department.toLowerCase()}`, {
                    defaultValue: person.known_for_department,
                  })}
                </Text>
              )}
              {person.birthday && (
                <Text variant="caption" className="text-muted-foreground">
                  {person.birthday.slice(0, 4)}
                  {person.place_of_birth ? ` · ${person.place_of_birth}` : ''}
                </Text>
              )}
            </div>
          </div>

          {/* TABS */}
          <div role="tablist" aria-label={t('person.filmography')} className="flex gap-2">
            {tabButton('movies', t('person.movies'), movieCredits.length, <FilmIcon size={12} color="currentColor" />)}
            {tabButton('series', t('person.series'), seriesCredits.length, <TvIcon size={12} color="currentColor" />)}
          </div>

          {/* CREDITS LIST */}
          <div
            id="person-tabpanel"
            role="tabpanel"
            aria-labelledby={`person-tab-${tab}`}
          >
          {currentCredits.length === 0 ? (
            <Text variant="small" className="text-muted-foreground italic text-center py-4">
              {t('person.noCredits')}
            </Text>
          ) : (
            <div role="list" aria-label={tab === 'movies' ? t('person.movies') : t('person.series')}>
              {currentCredits.map((credit) => {
                const isWatched =
                  tab === 'movies'
                    ? !!watchedMovies?.[credit.id]
                    : !!watchedSeries?.[credit.id]
                return (
                  <div key={`${credit.id}-${credit.media_type}`} role="listitem">
                    <CreditRow
                      credit={credit}
                      isWatched={isWatched}
                      onClick={onCreditClick ? () => { onCreditClick(credit.media_type, credit.id); onClose() } : undefined}
                    />
                  </div>
                )
              })}
            </div>
          )}
          </div>
        </div>
      )}
    </Modal>
  )
}
