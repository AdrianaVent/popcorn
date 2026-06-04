import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RecommendationsDrawer from './RecommendationsDrawer'
import type { TMDBPagedResponse, TMDBMovie } from '@/types/tmdb'

expect.extend(toHaveNoViolations)

const AXE_OPTS = { rules: { 'color-contrast': { enabled: false } } }

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

jest.mock('@/features/movies/movies.service', () => ({
  fetchMovieRecommendations: jest.fn(),
}))

jest.mock('@/features/series/series.service', () => ({
  fetchSeriesRecommendations: jest.fn(),
}))

jest.mock('@/components/common/MediaPoster', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <img src="/mock.jpg" alt={title} />,
}))

jest.mock('@/components/icons', () => ({
  XIcon: () => <svg data-testid="x-icon" />,
}))

import { fetchMovieRecommendations } from '@/features/movies/movies.service'

const mockMovies: TMDBPagedResponse<TMDBMovie> = {
  page: 1,
  total_pages: 1,
  total_results: 2,
  results: [
    { id: 101, title: 'The Matrix', original_title: 'The Matrix', overview: '', release_date: '1999-03-31', poster_path: '/matrix.jpg', backdrop_path: null, vote_average: 8.7, vote_count: 20000, popularity: 100, original_language: 'en', genre_ids: [28], adult: false },
    { id: 102, title: 'Interstellar', original_title: 'Interstellar', overview: '', release_date: '2014-11-07', poster_path: '/inter.jpg', backdrop_path: null, vote_average: 8.6, vote_count: 25000, popularity: 90, original_language: 'en', genre_ids: [18], adult: false },
  ],
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const defaultProps = {
  type: 'movie' as const,
  sourceId: 1,
  sourceName: 'Inception',
  sourcePosterPath: '/inception.jpg',
  watchedIds: new Set<number>(),
  onSelect: jest.fn(),
  onClose: jest.fn(),
}

describe('RecommendationsDrawer — axe', () => {
  it('has no axe violations when showing items', async () => {
    ;(fetchMovieRecommendations as jest.Mock).mockResolvedValue(mockMovies)
    const { container } = render(<RecommendationsDrawer {...defaultProps} />, { wrapper })
    // Wait for query to settle
    await screen.findByText('The Matrix')
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('RecommendationsDrawer — rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetchMovieRecommendations as jest.Mock).mockResolvedValue(mockMovies)
  })

  it('has complementary role with label', () => {
    render(<RecommendationsDrawer {...defaultProps} />, { wrapper })
    expect(screen.getByRole('complementary', { name: 'myList.recommendations.title' })).toBeInTheDocument()
  })

  it('shows source name in header', () => {
    render(<RecommendationsDrawer {...defaultProps} />, { wrapper })
    expect(screen.getByText('Inception')).toBeInTheDocument()
  })

  it('shows recommendation items after loading', async () => {
    render(<RecommendationsDrawer {...defaultProps} />, { wrapper })
    expect(await screen.findByText('The Matrix')).toBeInTheDocument()
    expect(screen.getByText('Interstellar')).toBeInTheDocument()
  })

  it('excludes items already in watchedIds', async () => {
    render(
      <RecommendationsDrawer {...defaultProps} watchedIds={new Set([101])} />,
      { wrapper }
    )
    await screen.findByText('Interstellar')
    expect(screen.queryByText('The Matrix')).not.toBeInTheDocument()
  })

  it('excludes collection part ids passed via watchedIds (saga siblings)', async () => {
    // Simulate caller passing saga part IDs merged into watchedIds
    render(
      <RecommendationsDrawer {...defaultProps} watchedIds={new Set([101, 102])} />,
      { wrapper }
    )
    // Both items filtered — component returns null, complementary role disappears
    await waitFor(() => {
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    })
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn()
    render(<RecommendationsDrawer {...defaultProps} onClose={onClose} />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onSelect with item id when an item is clicked', async () => {
    const onSelect = jest.fn()
    render(<RecommendationsDrawer {...defaultProps} onSelect={onSelect} />, { wrapper })
    fireEvent.click(await screen.findByText('The Matrix'))
    expect(onSelect).toHaveBeenCalledWith(101)
  })

  it('X icon in close button is aria-hidden', () => {
    const { container } = render(<RecommendationsDrawer {...defaultProps} />, { wrapper })
    const hidden = container.querySelector('[aria-hidden="true"]')
    expect(hidden).not.toBeNull()
    expect(hidden?.querySelector('[data-testid="x-icon"]')).not.toBeNull()
  })
})
