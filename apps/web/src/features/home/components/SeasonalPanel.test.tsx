import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import SeasonalPanel from './SeasonalPanel'
import type { TMDBMovie, TMDBSeries } from '@/types/tmdb'

const BASE_MOVIE = { overview: '', poster_path: null, backdrop_path: null, original_title: '', popularity: 1, adult: false, original_language: 'en' }
const BASE_SERIES = { overview: '', poster_path: null, backdrop_path: null, original_name: '', popularity: 1, origin_country: ['US'], original_language: 'en' }

const mockMovies: TMDBMovie[] = [
  { ...BASE_MOVIE, id: 1, title: 'Alpha', release_date: '2023-01-01', vote_average: 9.0, vote_count: 500, genre_ids: [878] },
  { ...BASE_MOVIE, id: 2, title: 'Beta',  release_date: '2022-05-10', vote_average: 7.5, vote_count: 300, genre_ids: [878] },
  { ...BASE_MOVIE, id: 3, title: 'Gamma', release_date: '2021-03-20', vote_average: 6.0, vote_count: 150, genre_ids: [878] },
]

const mockSeries: TMDBSeries[] = [
  { ...BASE_SERIES, id: 10, name: 'Serie A', first_air_date: '2020-09-01', vote_average: 8.5, vote_count: 400, genre_ids: [10765] },
  { ...BASE_SERIES, id: 11, name: 'Serie B', first_air_date: '2019-04-15', vote_average: 7.0, vote_count: 200, genre_ids: [10765] },
]

const mockUserId = 'u1'
let mockWatchedMovies: Record<string, unknown> = {}
let mockWatchedSeries: Record<string, unknown> = {}

const mockUseSeasonalRecommendations = jest.fn()

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: (fn: (s: { language: string }) => unknown) => fn({ language: 'en' }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: (fn: (s: { userId: string }) => unknown) => fn({ userId: mockUserId }),
}))

jest.mock('@/store/watchedStore', () => ({
  useWatchedStore: (fn: (s: { movies: Record<string, unknown>; seriesData: Record<string, unknown> }) => unknown) =>
    fn({ movies: { [mockUserId]: mockWatchedMovies }, seriesData: { [mockUserId]: mockWatchedSeries } }),
}))

jest.mock('@/features/home/hooks/useSeasonalRecommendations', () => ({
  useSeasonalRecommendations: (...args: unknown[]) => mockUseSeasonalRecommendations(...args),
}))

jest.mock('@/components/common/MediaPoster', () => ({
  __esModule: true,
  default: () => <div data-testid="poster" />,
}))

beforeEach(() => {
  mockWatchedMovies = {}
  mockWatchedSeries = {}
  mockUseSeasonalRecommendations.mockReturnValue({ movies: mockMovies, series: mockSeries, isLoading: false })
})

describe('SeasonalPanel', () => {
  it('renders region with panelTitle aria-label', () => {
    render(<SeasonalPanel month={1} />)
    expect(screen.getByRole('region', { name: 'seasonal.panelTitle' })).toBeInTheDocument()
  })

  it('renders movies and series column headings', () => {
    render(<SeasonalPanel month={1} />)
    expect(screen.getByText('nav.movies')).toBeInTheDocument()
    expect(screen.getByText('nav.series')).toBeInTheDocument()
  })

  it('renders month theme key', () => {
    render(<SeasonalPanel month={1} />)
    expect(screen.getByText('seasonal.january')).toBeInTheDocument()
  })

  it('renders all movie items as buttons with aria-label', () => {
    render(<SeasonalPanel month={1} />)
    expect(screen.getByRole('button', { name: 'Alpha (2023)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beta (2022)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gamma (2021)' })).toBeInTheDocument()
  })

  it('renders all series items as buttons with aria-label', () => {
    render(<SeasonalPanel month={1} />)
    expect(screen.getByRole('button', { name: 'Serie A (2020)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Serie B (2019)' })).toBeInTheDocument()
  })

  it('filters out watched movies', () => {
    mockWatchedMovies = { 1: {} }
    render(<SeasonalPanel month={1} />)
    expect(screen.queryByRole('button', { name: 'Alpha (2023)' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Beta (2022)' })).toBeInTheDocument()
  })

  it('filters out watched series', () => {
    mockWatchedSeries = { 10: {} }
    render(<SeasonalPanel month={1} />)
    expect(screen.queryByRole('button', { name: 'Serie A (2020)' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Serie B (2019)' })).toBeInTheDocument()
  })

  it('renders movies sorted by vote_average descending', () => {
    render(<SeasonalPanel month={1} />)
    const buttons = screen.getAllByRole('button')
    const movieLabels = buttons
      .map((b) => b.getAttribute('aria-label'))
      .filter((l): l is string => ['Alpha (2023)', 'Beta (2022)', 'Gamma (2021)'].includes(l ?? ''))
    expect(movieLabels).toEqual(['Alpha (2023)', 'Beta (2022)', 'Gamma (2021)'])
  })

  it('calls onMovieClick with the correct id', () => {
    const onMovieClick = jest.fn()
    render(<SeasonalPanel month={1} onMovieClick={onMovieClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Beta (2022)' }))
    expect(onMovieClick).toHaveBeenCalledWith(2)
  })

  it('calls onSeriesClick with the correct id', () => {
    const onSeriesClick = jest.fn()
    render(<SeasonalPanel month={1} onSeriesClick={onSeriesClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Serie B (2019)' }))
    expect(onSeriesClick).toHaveBeenCalledWith(11)
  })

  it('shows skeleton while loading', () => {
    mockUseSeasonalRecommendations.mockReturnValueOnce({ movies: [], series: [], isLoading: true })
    const { container } = render(<SeasonalPanel month={1} />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('marks grid as aria-busy while loading', () => {
    mockUseSeasonalRecommendations.mockReturnValueOnce({ movies: [], series: [], isLoading: true })
    render(<SeasonalPanel month={1} />)
    const grid = screen.getByRole('region', { name: 'seasonal.panelTitle' }).querySelector('[aria-busy="true"]')
    expect(grid).toBeInTheDocument()
  })
})
