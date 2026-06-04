'use client'

import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import SeriesDetailModal from './SeriesDetailModal'

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const map: Record<string, string> = {
        'common.trailer': 'Trailer',
        'common.noOverview': 'No synopsis available',
        'series.detail.watched': 'Watched',
        'series.detail.markSeriesWatched': 'Mark as watched',
        'series.detail.overview': 'Overview',
        'series.detail.genres': 'Genres',
        'series.detail.rating': 'Rating',
        'series.detail.votes': 'Votes',
        'series.detail.runtime': 'Runtime',
        'series.detail.year': 'Year',
        'series.detail.seasons': 'Seasons',
        'series.detail.episodes': 'Episodes',
        'myList.watchlist.add': 'Add to watchlist',
        'myList.watchlist.remove': 'Remove from watchlist',
      }
      return map[key] ?? opts?.defaultValue ?? key
    },
  }),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

const mockUserStore = { userId: 'user-1', role: 'guest' as 'guest' | 'admin' }
jest.mock('@/store/userStore', () => ({
  useUserStore: (selector: (s: { userId: string; role: string }) => unknown) =>
    selector(mockUserStore),
}))

const mockEpisodes: Record<string, Record<number, unknown>> = {}
jest.mock('@/store/watchedStore', () => ({
  useWatchedStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ episodes: mockEpisodes, markSeason: jest.fn() }),
}))

const mockWatchlistSeries: Record<string, Record<number, unknown>> = {}
jest.mock('@/store/watchlistStore', () => ({
  useWatchlistStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ series: mockWatchlistSeries, toggleSeries: jest.fn() }),
}))

const mockSeriesDetail = {
  detail: null as typeof SERIES_DETAIL | null,
  loading: false,
  error: null as string | null,
  totalRuntime: 2400,
}
jest.mock('@/features/series/hooks/useSeriesDetail', () => ({
  useSeriesDetail: () => mockSeriesDetail,
}))

jest.mock('@/hooks/useWatchProviders', () => ({
  useWatchProviders: () => ({ flatrate: [], rent: [], loading: false }),
}))

jest.mock('@/hooks/useTrailer', () => ({
  useTrailer: () => ({ allTrailers: [] }),
  useEnrichedTrailers: () => [],
  resolveHeaderTrailer: () => null,
}))

jest.mock('@/features/series/getSeriesUI', () => ({
  getSeriesUI: () => ({ firstAirYear: 2022, statusConfig: null }),
}))

jest.mock('@/features/series/series.service', () => ({
  fetchSeriesWatchProviders: jest.fn(),
  fetchSeasonDetail: jest.fn(),
  fetchSeriesVideos: jest.fn(),
}))

jest.mock('@/components/common/MediaPoster', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <img alt={title} />,
}))

jest.mock('@/components/common/WatchProviders', () => ({
  __esModule: true,
  default: () => <div data-testid="watch-providers" />,
}))

jest.mock('@/components/common/MediaDetailSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="skeleton" />,
}))

jest.mock('./SeriesMetaGrid', () => ({
  __esModule: true,
  default: () => <div data-testid="series-meta-grid" />,
}))

jest.mock('./SeasonsAccordion', () => ({
  __esModule: true,
  default: () => <div data-testid="seasons-accordion" />,
}))

jest.mock('@/components/ui/TrailerPlayer', () => ({
  __esModule: true,
  default: () => <div data-testid="trailer-player" />,
}))

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/icons', () => ({
  HeartIcon: ({ filled }: { filled: boolean }) => (
    <svg data-testid="heart-icon" data-filled={filled} />
  ),
  EyeIcon: () => <svg data-testid="eye-icon" />,
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const SERIES_DETAIL = {
  id: 1,
  name: 'Breaking Bad',
  tagline: 'Change the equation.',
  overview: 'A chemistry teacher turned drug lord.',
  poster_path: '/bb.jpg',
  first_air_date: '2008-01-20',
  vote_average: 9.5,
  vote_count: 12000,
  original_language: 'en',
  genres: [{ id: 18, name: 'Drama' }],
  number_of_seasons: 5,
  number_of_episodes: 62,
  seasons: [],
  status: 'Ended',
}

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: { 'color-contrast': { enabled: false } },
}

function renderModal() {
  return render(<SeriesDetailModal seriesId={1} onClose={jest.fn()} />)
}

// Reset mutable mock state before each test
beforeEach(() => {
  mockSeriesDetail.detail = SERIES_DETAIL
  mockSeriesDetail.loading = false
  mockSeriesDetail.error = null
  mockSeriesDetail.totalRuntime = 2400
  mockUserStore.userId = 'user-1'
  mockUserStore.role = 'guest'
  Object.keys(mockEpisodes).forEach((k) => delete mockEpisodes[k])
  Object.keys(mockWatchlistSeries).forEach((k) => delete mockWatchlistSeries[k])
})

// ── axe tests ─────────────────────────────────────────────────────────────────

describe('SeriesDetailModal — axe accessibility', () => {
  it('passes axe in normal state (guest)', async () => {
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when loading', async () => {
    mockSeriesDetail.detail = null
    mockSeriesDetail.loading = true
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe in error state', async () => {
    mockSeriesDetail.detail = null
    mockSeriesDetail.error = 'TMDB_NOT_FOUND'
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when series has no overview', async () => {
    mockSeriesDetail.detail = { ...SERIES_DETAIL, overview: '' }
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when admin role', async () => {
    mockUserStore.role = 'admin'
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when series is in watchlist', async () => {
    mockWatchlistSeries['user-1'] = { 1: { id: 1 } }
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

// ── ARIA structure ────────────────────────────────────────────────────────────

describe('SeriesDetailModal — ARIA structure', () => {
  it('shows series name in the modal heading', () => {
    renderModal()
    // Modal renders title in both its header h2 and the content h2
    const headings = screen.getAllByRole('heading', { name: 'Breaking Bad' })
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('renders overview text when available', () => {
    renderModal()
    expect(screen.getByText('A chemistry teacher turned drug lord.')).toBeInTheDocument()
  })

  it('renders no-overview message when overview is empty', () => {
    mockSeriesDetail.detail = { ...SERIES_DETAIL, overview: '' }
    renderModal()
    expect(screen.getByText('No synopsis available')).toBeInTheDocument()
  })

  it('renders no-overview message when overview is absent', () => {
    mockSeriesDetail.detail = { ...SERIES_DETAIL, overview: undefined as unknown as string }
    renderModal()
    expect(screen.getByText('No synopsis available')).toBeInTheDocument()
  })

  it('watchlist button has aria-label "Add to watchlist" when not in watchlist', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Add to watchlist' })).toBeInTheDocument()
  })

  it('watchlist button has aria-pressed=false when not in watchlist', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Add to watchlist' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('watchlist button has aria-label "Remove from watchlist" when in watchlist', () => {
    mockWatchlistSeries['user-1'] = { 1: { id: 1 } }
    renderModal()
    expect(screen.getByRole('button', { name: 'Remove from watchlist' })).toBeInTheDocument()
  })

  it('watchlist button has aria-pressed=true when in watchlist', () => {
    mockWatchlistSeries['user-1'] = { 1: { id: 1 } }
    renderModal()
    expect(screen.getByRole('button', { name: 'Remove from watchlist' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('"Mark as watched" button has aria-pressed=false when series not watched', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Mark as watched' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('watchlist and watched buttons are hidden for admin', () => {
    mockUserStore.role = 'admin'
    renderModal()
    expect(screen.queryByRole('button', { name: 'Add to watchlist' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark as watched' })).not.toBeInTheDocument()
  })

  it('tagline is rendered when present', () => {
    renderModal()
    expect(screen.getByText('Change the equation.')).toBeInTheDocument()
  })

  it('loading state shows skeleton and hides content', () => {
    mockSeriesDetail.detail = null
    mockSeriesDetail.loading = true
    renderModal()
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Breaking Bad')).not.toBeInTheDocument()
  })
})
