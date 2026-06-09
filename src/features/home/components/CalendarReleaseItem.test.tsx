import { render, screen, fireEvent } from '@testing-library/react'
import CalendarReleaseItem from './CalendarReleaseItem'
import { getGenreIcon } from '@/config/genreIcons'
import type { LucideIcon } from 'lucide-react'
import type { ReleaseEntry } from '@/services/tmdb/releases'

const mockGetGenreIcon = jest.mocked(getGenreIcon)

// Mutable state for per-test role and store overrides
let mockRole = 'guest'
let mockWatchedMovies: Record<string, Record<number, unknown>> = {}
let mockWatchlistMovies: Record<string, Record<number, unknown>> = {}
const mockToggleMovie = jest.fn()

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

jest.mock('@/config/genreIcons', () => ({ getGenreIcon: jest.fn(() => null) }))
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
    fn({ movies: mockWatchlistMovies, series: {}, toggleMovie: mockToggleMovie, toggleSeries: jest.fn() }),
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
  mockWatchlistMovies = {}
  mockToggleMovie.mockReset()
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

describe('CalendarReleaseItem — watchlist toggle', () => {
  it('renders heart button with aria-pressed="false" when not in watchlist', () => {
    render(<CalendarReleaseItem {...BASE_PROPS} />)
    const btn = screen.getByRole('button', { name: 'myList.watchlist.add' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders heart button with aria-pressed="true" when movie is in watchlist', () => {
    mockWatchlistMovies = { 'user-1': { 1: {} } }
    render(<CalendarReleaseItem {...BASE_PROPS} />)
    const btn = screen.getByRole('button', { name: 'myList.watchlist.remove' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls toggleMovie when heart button is clicked', () => {
    render(<CalendarReleaseItem {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: 'myList.watchlist.add' }))
    expect(mockToggleMovie).toHaveBeenCalledTimes(1)
  })

  it('calls toggleMovie with the release data', () => {
    render(<CalendarReleaseItem {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: 'myList.watchlist.add' }))
    expect(mockToggleMovie).toHaveBeenCalledWith('user-1', expect.objectContaining({ id: 1, title: 'Test Movie' }))
  })
})

describe('CalendarReleaseItem — genre icon deduplication', () => {
  const IconA = () => <span data-testid="icon-a" />
  const IconB = () => <span data-testid="icon-b" />

  afterEach(() => mockGetGenreIcon.mockReturnValue(null))

  it('renders only one icon when two genre_ids share the same icon', () => {
    mockGetGenreIcon.mockImplementation(
      (id) => (id === 28 || id === 12 ? IconA : null) as LucideIcon | null,
    )
    render(<CalendarReleaseItem
      release={{ ...RELEASE, genre_ids: [28, 12] }}
      genreMap={{ 28: 'Action', 12: 'Adventure' }}
      language="es"
    />)
    expect(screen.getAllByTestId('icon-a')).toHaveLength(1)
  })

  it('renders two icons when genre_ids have different icons', () => {
    mockGetGenreIcon.mockImplementation(
      (id) => (id === 28 ? IconA : id === 18 ? IconB : null) as LucideIcon | null,
    )
    render(<CalendarReleaseItem
      release={{ ...RELEASE, genre_ids: [28, 18] }}
      genreMap={{ 28: 'Action', 18: 'Drama' }}
      language="es"
    />)
    expect(screen.getAllByTestId('icon-a')).toHaveLength(1)
    expect(screen.getAllByTestId('icon-b')).toHaveLength(1)
  })
})
