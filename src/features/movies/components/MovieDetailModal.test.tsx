'use client'

import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import MovieDetailModal from './MovieDetailModal'

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const map: Record<string, string> = {
        'common.trailer': 'Trailer',
        'common.noOverview': 'No synopsis available',
        'movies.detail.watched': 'Watched',
        'movies.detail.markWatched': 'Mark as watched',
        'movies.detail.overview': 'Overview',
        'movies.detail.release': 'Release',
        'movies.detail.genres': 'Genres',
        'movies.detail.rating': 'Rating',
        'movies.detail.votes': 'Votes',
        'movies.detail.runtime': 'Runtime',
        'movies.detail.year': 'Year',
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

const mockWatchedMovies: Record<string, Record<number, unknown>> = {}
jest.mock('@/store/watchedStore', () => ({
  useWatchedStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ movies: mockWatchedMovies, toggleMovie: jest.fn(), enrichMovie: jest.fn() }),
}))

const mockWatchlistMovies: Record<string, Record<number, unknown>> = {}
jest.mock('@/store/watchlistStore', () => ({
  useWatchlistStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ movies: mockWatchlistMovies, toggleMovie: jest.fn() }),
}))

const mockMovieDetail = {
  detail: null as typeof MOVIE_DETAIL | null,
  loading: false,
  error: null as string | null,
}
jest.mock('@/features/movies/hooks/useMovieDetail', () => ({
  useMovieDetail: () => mockMovieDetail,
}))

jest.mock('@/hooks/useWatchProviders', () => ({
  useWatchProviders: () => ({ flatrate: [], rent: [], loading: false }),
}))

jest.mock('@/features/movies/hooks/useMovieInTheaters', () => ({
  useMovieInTheaters: () => ({ inTheaters: false, loading: false }),
}))

jest.mock('@/hooks/useTrailer', () => ({
  useTrailer: () => ({ trailer: null }),
}))

const mockMovieUI = { isUpcoming: false, releaseYear: 2023 as number | null, resolvedDate: null as string | null }
jest.mock('@/features/movies/getMovieUI', () => ({
  getMovieUI: () => mockMovieUI,
}))

jest.mock('@/features/movies/movies.service', () => ({
  fetchMovieWatchProviders: jest.fn(),
  fetchMovieVideos: jest.fn(),
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

jest.mock('./CollectionAccordion', () => ({
  __esModule: true,
  default: () => <div data-testid="collection-accordion" />,
}))

jest.mock('./MovieMetaGrid', () => ({
  __esModule: true,
  default: () => <div data-testid="movie-meta-grid" />,
}))

jest.mock('@/components/ui/TrailerPlayer', () => ({
  __esModule: true,
  default: () => <div data-testid="trailer-player" />,
}))

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/utils/formatDate', () => ({
  formatMonthYear: () => 'June 2023',
}))

jest.mock('@/components/icons', () => ({
  HeartIcon: ({ filled }: { filled: boolean }) => (
    <svg data-testid="heart-icon" data-filled={filled} />
  ),
  EyeIcon: () => <svg data-testid="eye-icon" />,
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const MOVIE_DETAIL = {
  id: 1,
  title: 'Inception',
  tagline: 'Your mind is the scene of the crime.',
  overview: 'A mind-bending thriller.',
  poster_path: '/inception.jpg',
  release_date: '2010-07-16',
  runtime: 148,
  vote_average: 8.4,
  vote_count: 34000,
  original_language: 'en',
  genres: [{ id: 28, name: 'Action' }],
  belongs_to_collection: null,
}

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: { 'color-contrast': { enabled: false } },
}

function renderModal() {
  return render(<MovieDetailModal movieId={1} onClose={jest.fn()} />)
}

// Reset mutable mock state before each test
beforeEach(() => {
  mockMovieDetail.detail = MOVIE_DETAIL
  mockMovieDetail.loading = false
  mockMovieDetail.error = null
  mockMovieUI.isUpcoming = false
  mockMovieUI.releaseYear = 2023
  mockMovieUI.resolvedDate = null
  mockUserStore.userId = 'user-1'
  mockUserStore.role = 'guest'
  // clear watched/watchlist state
  Object.keys(mockWatchedMovies).forEach((k) => delete mockWatchedMovies[k])
  Object.keys(mockWatchlistMovies).forEach((k) => delete mockWatchlistMovies[k])
})

// ── axe tests ─────────────────────────────────────────────────────────────────

describe('MovieDetailModal — axe accessibility', () => {
  it('passes axe in normal state (guest)', async () => {
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when loading', async () => {
    mockMovieDetail.detail = null
    mockMovieDetail.loading = true
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe in error state', async () => {
    mockMovieDetail.detail = null
    mockMovieDetail.error = 'TMDB_NOT_FOUND'
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when movie has no overview', async () => {
    mockMovieDetail.detail = { ...MOVIE_DETAIL, overview: '' }
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when movie is upcoming', async () => {
    mockMovieUI.isUpcoming = true
    mockMovieUI.resolvedDate = '2025-12-01'
    mockMovieUI.releaseYear = null
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when admin role', async () => {
    mockUserStore.role = 'admin'
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when movie is already watched (watchlist hidden)', async () => {
    mockWatchedMovies['user-1'] = { 1: { id: 1, title: 'Inception' } }
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when movie is in watchlist', async () => {
    mockWatchlistMovies['user-1'] = { 1: { id: 1 } }
    const { container } = renderModal()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

// ── ARIA structure ────────────────────────────────────────────────────────────

describe('MovieDetailModal — ARIA structure', () => {
  it('shows movie title in the modal heading', () => {
    renderModal()
    // Modal renders title in both its header h2 and the content h2
    const headings = screen.getAllByRole('heading', { name: 'Inception' })
    expect(headings.length).toBeGreaterThanOrEqual(1)
  })

  it('renders overview text when available', () => {
    renderModal()
    expect(screen.getByText('A mind-bending thriller.')).toBeInTheDocument()
  })

  it('renders no-overview message when overview is empty', () => {
    mockMovieDetail.detail = { ...MOVIE_DETAIL, overview: '' }
    renderModal()
    expect(screen.getByText('No synopsis available')).toBeInTheDocument()
  })

  it('renders no-overview message when overview is absent', () => {
    mockMovieDetail.detail = { ...MOVIE_DETAIL, overview: undefined as unknown as string }
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
    mockWatchlistMovies['user-1'] = { 1: { id: 1 } }
    renderModal()
    expect(screen.getByRole('button', { name: 'Remove from watchlist' })).toBeInTheDocument()
  })

  it('watchlist button has aria-pressed=true when in watchlist', () => {
    mockWatchlistMovies['user-1'] = { 1: { id: 1 } }
    renderModal()
    expect(screen.getByRole('button', { name: 'Remove from watchlist' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('"Mark as watched" button has aria-pressed=false when not watched', () => {
    renderModal()
    expect(screen.getByRole('button', { name: 'Mark as watched' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('"Watched" button has aria-pressed=true when movie is watched', () => {
    mockWatchedMovies['user-1'] = { 1: { id: 1, title: 'Inception' } }
    renderModal()
    expect(screen.getByRole('button', { name: 'Watched' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('watchlist and watched buttons are hidden for admin', () => {
    mockUserStore.role = 'admin'
    renderModal()
    expect(screen.queryByRole('button', { name: 'Add to watchlist' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark as watched' })).not.toBeInTheDocument()
  })

  it('tagline is rendered when present', () => {
    renderModal()
    expect(screen.getByText('Your mind is the scene of the crime.')).toBeInTheDocument()
  })

  it('loading state shows skeleton and hides content', () => {
    mockMovieDetail.detail = null
    mockMovieDetail.loading = true
    renderModal()
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    expect(screen.queryByText('Inception')).not.toBeInTheDocument()
  })

  it('"Mark as watched" button is hidden when movie is upcoming and not yet watched', () => {
    mockMovieUI.isUpcoming = true
    renderModal()
    expect(screen.queryByRole('button', { name: 'Mark as watched' })).not.toBeInTheDocument()
  })
})
