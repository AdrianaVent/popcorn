import { render, screen, fireEvent } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import ReleaseCalendar from './ReleaseCalendar'
import type { ReleaseEntry } from '@/services/tmdb/releases'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.number != null) return `S${opts.number}`
      if (opts?.count != null) return `${opts.count} ep.`
      const map: Record<string, string> = {
        'calendar.title':      'Release calendar',
        'calendar.today':      'Today',
        'calendar.prevMonth':  'Previous month',
        'calendar.nextMonth':  'Next month',
        'calendar.close':      'Close',
        'calendar.error':      'Could not load releases',
        'calendar.empty':      'No releases on this day',
        'calendar.noOverview': 'No synopsis available',
      }
      return map[key] ?? key
    },
  }),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: (fn: (s: { language: string }) => unknown) => fn({ language: 'en' }),
}))

jest.mock('@/components/common/MediaPoster', () => ({
  __esModule: true,
  default: () => <div data-testid="poster" />,
}))

jest.mock('@/components/ui/Text', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

jest.mock('@/components/icons', () => ({
  ChevronLeftIcon: () => <span>prev</span>,
  ChevronRightIcon: () => <span>next</span>,
  FilmIcon: () => <span>film</span>,
  TvIcon: () => <span>tv</span>,
  XIcon: () => <span>close</span>,
  HeartIcon: () => <span>heart</span>,
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: (fn: (s: { role: string; userId: string | null }) => unknown) =>
    fn({ role: 'guest', userId: 'user-1' }),
}))

jest.mock('@/store/watchedStore', () => ({
  useWatchedStore: (fn: (s: { movies: Record<string, Record<number, unknown>>; seriesData: Record<string, Record<number, unknown>> }) => unknown) =>
    fn({ movies: {}, seriesData: {} }),
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

jest.mock('@/features/series/getSeriesUI', () => ({
  getStatusConfig: () => null,
}))

jest.mock('@/hooks/useTrailer', () => ({
  useTrailer: () => ({ trailer: null, isLoading: false }),
}))

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/config/genreIcons', () => ({
  getGenreIcon: () => null,
}))

jest.mock('@/features/movies/movies.service', () => ({
  fetchMovieVideos: jest.fn(),
}))

jest.mock('@/features/series/series.service', () => ({
  fetchSeriesVideos: jest.fn(),
  fetchSeasonVideos: jest.fn(),
}))

const RELEASE: ReleaseEntry = {
  id: 1,
  title: 'Test Movie',
  date: '2025-05-15',
  poster_path: null,
  overview: 'A great movie.',
  genre_ids: [],
}

const BASE_PROPS = {
  year: 2025,
  month: 5,
  tab: 'movies' as const,
  onTabChange: jest.fn(),
  onPrevMonth: jest.fn(),
  onNextMonth: jest.fn(),
  onToday: jest.fn(),
  query: { data: [RELEASE], isLoading: false, isError: false },
}

describe('ReleaseCalendar', () => {
  describe('header', () => {
    it('shows the calendar title', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      expect(screen.getByText('Release calendar')).toBeInTheDocument()
    })

    it('shows the month name and year', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      expect(screen.getByText('May 2025')).toBeInTheDocument()
    })

    it('shows the Today button when not on the current month', () => {
      render(<ReleaseCalendar {...BASE_PROPS} year={2024} month={1} />)
      expect(screen.getByText('Today')).toBeInTheDocument()
    })

    it('hides the Today button when on the current month', () => {
      const now = new Date()
      render(<ReleaseCalendar {...BASE_PROPS} year={now.getFullYear()} month={now.getMonth() + 1} />)
      expect(screen.queryByText('Today')).not.toBeInTheDocument()
    })

    it('calls onPrevMonth when the prev button is clicked', () => {
      const onPrevMonth = jest.fn()
      render(<ReleaseCalendar {...BASE_PROPS} onPrevMonth={onPrevMonth} />)
      fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
      expect(onPrevMonth).toHaveBeenCalledTimes(1)
    })

    it('calls onNextMonth when the next button is clicked', () => {
      const onNextMonth = jest.fn()
      render(<ReleaseCalendar {...BASE_PROPS} onNextMonth={onNextMonth} />)
      fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
      expect(onNextMonth).toHaveBeenCalledTimes(1)
    })
  })

  describe('day selection', () => {
    it('marks a day with a release indicator', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      const day15 = screen.getByRole('button', { name: /May 15, 2025/ })
      expect(day15.querySelector('.bg-primary')).not.toBeNull()
    })

    it('clicking a day with a release shows the releases panel', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      fireEvent.click(screen.getByRole('button', { name: /May 15, 2025/ }))
      expect(screen.getByText('Test Movie')).toBeInTheDocument()
    })

    it('shows the release overview in the panel', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      fireEvent.click(screen.getByRole('button', { name: /May 15, 2025/ }))
      expect(screen.getByText('A great movie.')).toBeInTheDocument()
    })

    it('clicking X closes the panel and restores the calendar', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      fireEvent.click(screen.getByRole('button', { name: /May 15, 2025/ }))
      expect(screen.getByText('Test Movie')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByText('Test Movie')).not.toBeInTheDocument()
      expect(screen.getByText('May 2025')).toBeInTheDocument()
    })

    it('calls onEntryClick with the release id when an entry is clicked', () => {
      const onEntryClick = jest.fn()
      render(<ReleaseCalendar {...BASE_PROPS} onEntryClick={onEntryClick} />)
      fireEvent.click(screen.getByRole('button', { name: /May 15, 2025/ }))
      fireEvent.click(screen.getByText('Test Movie'))
      expect(onEntryClick).toHaveBeenCalledWith(1)
    })

    it('shows "no overview" message when overview is null', () => {
      const releaseNoOverview: ReleaseEntry = { ...RELEASE, overview: null }
      render(<ReleaseCalendar {...BASE_PROPS} query={{ data: [releaseNoOverview], isLoading: false, isError: false }} />)
      fireEvent.click(screen.getByRole('button', { name: /May 15, 2025/ }))
      expect(screen.getByText('No synopsis available')).toBeInTheDocument()
    })
  })

  describe('loading and error states', () => {
    it('shows a loading skeleton when isLoading is true', () => {
      const { container } = render(
        <ReleaseCalendar {...BASE_PROPS} query={{ data: undefined, isLoading: true, isError: false }} />
      )
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })

    it('shows an error message when isError is true', () => {
      render(
        <ReleaseCalendar {...BASE_PROPS} query={{ data: undefined, isLoading: false, isError: true }} />
      )
      expect(screen.getByText('Could not load releases')).toBeInTheDocument()
    })
  })
})

// ── axe accessibility ─────────────────────────────────────────────────────────

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: { 'color-contrast': { enabled: false } },
}

describe('ReleaseCalendar — axe accessibility', () => {
  it('passes axe in default state (calendar grid)', async () => {
    const { container } = render(<ReleaseCalendar {...BASE_PROPS} />)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe in loading state', async () => {
    const { container } = render(
      <ReleaseCalendar {...BASE_PROPS} query={{ data: undefined, isLoading: true, isError: false }} />
    )
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe in error state', async () => {
    const { container } = render(
      <ReleaseCalendar {...BASE_PROPS} query={{ data: undefined, isLoading: false, isError: true }} />
    )
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe on empty month (no releases)', async () => {
    const { container } = render(
      <ReleaseCalendar {...BASE_PROPS} query={{ data: [], isLoading: false, isError: false }} />
    )
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe with releases panel open', async () => {
    const { container } = render(<ReleaseCalendar {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /May 15, 2025/ }))
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe on series tab', async () => {
    const { container } = render(
      <ReleaseCalendar {...BASE_PROPS} tab="series" />
    )
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe with animation from left', async () => {
    const { container } = render(
      <ReleaseCalendar {...BASE_PROPS} animateFrom="left" />
    )
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

// ── ARIA structure ────────────────────────────────────────────────────────────

describe('ReleaseCalendar — ARIA structure', () => {
  it('renders as a region landmark with the calendar title as label', () => {
    render(<ReleaseCalendar {...BASE_PROPS} />)
    expect(screen.getByRole('region', { name: 'Release calendar' })).toBeInTheDocument()
  })

  it('prev-month button has an accessible label', () => {
    render(<ReleaseCalendar {...BASE_PROPS} year={2024} month={1} />)
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument()
  })

  it('next-month button has an accessible label', () => {
    render(<ReleaseCalendar {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument()
  })

  it('close button has an accessible label', () => {
    render(<ReleaseCalendar {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /May 15, 2025/ }))
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('release-day buttons are enabled and plain-day buttons are disabled', () => {
    render(<ReleaseCalendar {...BASE_PROPS} />)
    // Day 15 has a release → enabled
    expect(screen.getByRole('button', { name: /May 15, 2025/ })).not.toBeDisabled()
    // Day 1 has no release → disabled
    expect(screen.getByRole('button', { name: 'May 1, 2025' })).toBeDisabled()
  })
})
