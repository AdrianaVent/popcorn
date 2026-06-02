import { render, screen } from '@testing-library/react'
import CalendarReleaseItem from './CalendarReleaseItem'
import type { ReleaseEntry } from '@/services/tmdb/releases'

// Mutable state for per-test role and watched overrides
let mockRole = 'guest'
let mockWatchedMovies: Record<string, Record<number, unknown>> = {}

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/components/common/MediaPoster', () => ({
  __esModule: true,
  default: () => <div data-testid="poster" />,
}))

jest.mock('@/components/ui/Text', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/ui/TrailerPlayer', () => ({
  __esModule: true,
  default: () => <div data-testid="trailer" />,
}))

jest.mock('@/components/icons', () => ({
  HeartIcon: () => <span data-testid="heart-icon" />,
}))

jest.mock('@/config/genreIcons', () => ({ getGenreIcon: () => null }))
jest.mock('@/features/series/getSeriesUI', () => ({ getStatusConfig: () => null }))
jest.mock('@/features/movies/movies.service', () => ({ fetchMovieVideos: jest.fn() }))
jest.mock('@/features/series/series.service', () => ({
  fetchSeriesVideos: jest.fn(),
  fetchSeasonVideos: jest.fn(),
}))
jest.mock('@/hooks/useTrailer', () => ({
  useTrailer: () => ({ trailer: null }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: (fn: (s: { role: string; userId: string | null }) => unknown) =>
    fn({ role: mockRole, userId: 'user-1' }),
}))

jest.mock('@/store/watchedStore', () => ({
  useWatchedStore: (fn: (s: { movies: Record<string, Record<number, unknown>>; seriesData: Record<string, Record<number, unknown>> }) => unknown) =>
    fn({ movies: mockWatchedMovies, seriesData: {} }),
}))

jest.mock('@/store/watchlistStore', () => ({
  useWatchlistStore: (fn: (s: {
    movies: Record<string, Record<number, unknown>>;
    series: Record<string, Record<number, unknown>>;
    toggleMovie: jest.Mock;
    toggleSeries: jest.Mock;
  }) => unknown) =>
    fn({ movies: {}, series: {}, toggleMovie: jest.fn(), toggleSeries: jest.fn() }),
}))

const RELEASE: ReleaseEntry = {
  id: 1,
  title: 'Test Movie',
  date: '2026-06-05',
  poster_path: null,
  overview: 'An overview.',
  genre_ids: [],
}

const BASE_PROPS = { release: RELEASE, genreMap: {}, language: 'es' }

beforeEach(() => {
  mockRole = 'guest'
  mockWatchedMovies = {}
})

describe('CalendarReleaseItem — heart button visibility', () => {
  it('shows the heart button for a guest user', () => {
    render(<CalendarReleaseItem {...BASE_PROPS} />)
    expect(screen.queryByTestId('heart-icon')).not.toBeNull()
  })

  it('hides the heart button for an admin user', () => {
    mockRole = 'admin'
    render(<CalendarReleaseItem {...BASE_PROPS} />)
    expect(screen.queryByTestId('heart-icon')).toBeNull()
  })

  it('hides the heart button when the movie is already watched', () => {
    mockWatchedMovies = { 'user-1': { 1: {} } }
    render(<CalendarReleaseItem {...BASE_PROPS} />)
    expect(screen.queryByTestId('heart-icon')).toBeNull()
  })
})
