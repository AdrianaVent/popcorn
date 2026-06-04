import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import MovieCard from './MovieCard'
import type { StoredMovie } from '@/store/watchedStore'

expect.extend(toHaveNoViolations)

const AXE_OPTS = { rules: { 'color-contrast': { enabled: false } } }

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

jest.mock('@/components/common/MediaCard', () => ({
  __esModule: true,
  default: ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <div>
      <button onClick={onClick} aria-label={title}>{title}</button>
      {children}
    </div>
  ),
}))

jest.mock('@/components/ui/StarRating', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value: number | null; onChange?: (v: number) => void }) => (
    <div role="slider" aria-label="Rating" aria-valuenow={value ?? 0} onClick={() => onChange?.(4)} />
  ),
}))

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const makeMovie = (overrides: Partial<StoredMovie> = {}): StoredMovie => ({
  id: 1,
  title: 'Inception',
  release_date: '2010-07-16',
  vote_average: 8.4,
  vote_count: 30000,
  poster_path: '/inception.jpg',
  original_language: 'en',
  watchedAt: 1000,
  ...overrides,
})

describe('MovieCard — axe', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <MovieCard movie={makeMovie()} rating={null} onRate={jest.fn()} onClick={jest.fn()} />
    )
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('MovieCard — rendering', () => {
  it('renders the movie title as button accessible name', () => {
    render(<MovieCard movie={makeMovie()} rating={null} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Inception' })).toBeInTheDocument()
  })

  it('renders the release year', () => {
    render(<MovieCard movie={makeMovie()} rating={null} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.getByText('2010')).toBeInTheDocument()
  })

  it('does not render a year when release_date is missing', () => {
    render(<MovieCard movie={makeMovie({ release_date: '' })} rating={null} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument()
  })

  it('renders the StarRating with the given rating value', () => {
    render(<MovieCard movie={makeMovie()} rating={3.5} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '3.5')
  })

  it('renders the Similar button when showRecommendations is true (default)', () => {
    render(<MovieCard movie={makeMovie()} rating={null} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'myList.recommendations.similar' })).toBeInTheDocument()
  })

  it('hides the Similar button when showRecommendations is false', () => {
    render(<MovieCard movie={makeMovie()} rating={null} onRate={jest.fn()} onClick={jest.fn()} showRecommendations={false} />)
    expect(screen.queryByRole('button', { name: 'myList.recommendations.similar' })).not.toBeInTheDocument()
  })

  it('Similar button is disabled when onShowRecommendations is not provided', () => {
    render(<MovieCard movie={makeMovie()} rating={null} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'myList.recommendations.similar' })).toBeDisabled()
  })

  it('Similar button is enabled and calls handler when onShowRecommendations is provided', () => {
    const onRec = jest.fn()
    render(<MovieCard movie={makeMovie()} rating={4} onRate={jest.fn()} onClick={jest.fn()} onShowRecommendations={onRec} />)
    const btn = screen.getByRole('button', { name: 'myList.recommendations.similar' })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(onRec).toHaveBeenCalledTimes(1)
  })
})
