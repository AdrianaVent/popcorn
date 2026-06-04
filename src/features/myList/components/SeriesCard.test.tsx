import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import SeriesCard from './SeriesCard'
import type { StoredSeries } from '@/store/watchedStore'

expect.extend(toHaveNoViolations)

const AXE_OPTS = { rules: { 'color-contrast': { enabled: false } } }

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

jest.mock('clsx', () => ({
  __esModule: true,
  default: (...args: unknown[]) => args.filter(Boolean).join(' '),
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
  default: ({ value, readonly }: { value: number | null; readonly?: boolean }) => (
    <div role="slider" aria-label="Rating" aria-valuenow={value ?? 0} aria-readonly={readonly ?? false} />
  ),
}))

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const makeSeries = (overrides: Partial<StoredSeries> = {}): StoredSeries => ({
  id: 10,
  name: 'Breaking Bad',
  first_air_date: '2008-01-20',
  vote_average: 9.5,
  vote_count: 10000,
  original_language: 'en',
  poster_path: '/bb.jpg',
  number_of_episodes: 62,
  watchedAt: 1000,
  ...overrides,
})

describe('SeriesCard — axe', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <SeriesCard series={makeSeries()} watchedEpisodes={0} rating={null} onRate={jest.fn()} onClick={jest.fn()} />
    )
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('SeriesCard — rendering', () => {
  it('renders the series name as button accessible name', () => {
    render(<SeriesCard series={makeSeries()} watchedEpisodes={10} rating={null} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Breaking Bad' })).toBeInTheDocument()
  })

  it('renders episode progress badge when total > 0', () => {
    render(<SeriesCard series={makeSeries()} watchedEpisodes={10} rating={null} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.getByText('10/62 ep.')).toBeInTheDocument()
  })

  it('does not render episode badge when total is 0', () => {
    render(<SeriesCard series={makeSeries({ number_of_episodes: 0 })} watchedEpisodes={0} rating={null} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.queryByText(/ep\./)).not.toBeInTheDocument()
  })

  it('StarRating is readonly when series is not completed', () => {
    render(<SeriesCard series={makeSeries()} watchedEpisodes={10} rating={null} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-readonly', 'true')
  })

  it('StarRating is not readonly when series is completed', () => {
    render(<SeriesCard series={makeSeries()} watchedEpisodes={62} rating={null} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-readonly', 'false')
  })

  it('Similar button is disabled when onShowRecommendations is not provided', () => {
    render(<SeriesCard series={makeSeries()} watchedEpisodes={0} rating={null} onRate={jest.fn()} onClick={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'myList.recommendations.similar' })).toBeDisabled()
  })

  it('Similar button is enabled and calls handler when provided', () => {
    const onRec = jest.fn()
    render(<SeriesCard series={makeSeries()} watchedEpisodes={62} rating={4} onRate={jest.fn()} onClick={jest.fn()} onShowRecommendations={onRec} />)
    const btn = screen.getByRole('button', { name: 'myList.recommendations.similar' })
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(onRec).toHaveBeenCalledTimes(1)
  })
})
