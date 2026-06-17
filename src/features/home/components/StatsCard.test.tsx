import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import StatsCard, { buildRatingHistogram, buildDecadeDistribution } from './StatsCard'
import type { UserState }     from '@/store/userStore'
import type { WatchedState }  from '@/store/watchedStore'
import type { RatingsState }  from '@/store/ratingsStore'
import type { LanguageState } from '@/store/languageStore'

// ─── Recharts ─────────────────────────────────────────────────────────────────

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: React.PropsWithChildren) => <div data-testid="chart">{children}</div>,
  AreaChart:           ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  BarChart:            ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Area: () => null, Bar: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null,
}))

// ─── i18n ─────────────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string) => {
      const map: Record<string, string> = {
        'dashboard.stats.titleGuest':         'My activity',
        'dashboard.stats.titleAdmin':         'Users',
        'dashboard.stats.movies':             'Movies',
        'dashboard.stats.sagas':              'Sagas',
        'dashboard.stats.series':             'Series',
        'dashboard.stats.episodes':           'Episodes',
        'dashboard.stats.avgRating':          'Avg. rating',
        'dashboard.stats.totalUsers':         'Total users',
        'dashboard.stats.guests':             'Guests',
        'dashboard.stats.admins':             'Admins',
        'dashboard.stats.newThisMonth':       'New this month',
        'dashboard.stats.activityChart':      'Activity',
        'dashboard.stats.registrationsChart': 'Registrations',
        'dashboard.stats.noActivity':              'No activity yet',
        'dashboard.stats.noInsights':             'No insights yet',
        'dashboard.stats.noUsers':                'No users yet',
        'dashboard.stats.titles':                 'titles',
        'dashboard.stats.period.daily':           'day',
        'dashboard.stats.period.weekly':          'week',
        'dashboard.stats.period.monthly':         'month',
        'dashboard.stats.tab.activity':           'Activity',
        'dashboard.stats.tab.insights':           'Summary',
        'dashboard.stats.tabGroup':               'View',
        'dashboard.stats.ratingsChart':           'My ratings',
        'dashboard.stats.decadesChart':           'By decade',
        'dashboard.stats.seriesCompletion':       'series completed',
        'dashboard.chart.error':                  'Could not load data',
        'users.title':                            'Users',
      }
      return map[k] ?? k
    },
  }),
}))

// ─── Stores ───────────────────────────────────────────────────────────────────

jest.mock('@/store/userStore',    () => ({ useUserStore:    jest.fn() }))
jest.mock('@/store/watchedStore', () => ({ useWatchedStore: jest.fn() }))
jest.mock('@/store/ratingsStore', () => ({ useRatingsStore: jest.fn() }))
jest.mock('@/store/languageStore',() => ({ useLanguageStore:jest.fn() }))

// ─── External deps ────────────────────────────────────────────────────────────

jest.mock('@/features/movies/movies.service', () => ({
  fetchCollectionDetail: jest.fn(),
}))

jest.mock('@/services/apiFetch', () => ({
  apiFetch: jest.fn(),
}))

jest.mock('@/config/tmdb', () => ({
  TMDB_LANGUAGE: { en: 'en-US', es: 'es-ES' },
}))

jest.mock('@/components/ui/Text', () => ({
  __esModule: true,
  default: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
}))

import { useUserStore }    from '@/store/userStore'
import { useWatchedStore } from '@/store/watchedStore'
import { useRatingsStore } from '@/store/ratingsStore'
import { useLanguageStore }from '@/store/languageStore'
import { apiFetch }        from '@/services/apiFetch'

const mockUserStore    = jest.mocked(useUserStore)
const mockWatchedStore = jest.mocked(useWatchedStore)
const mockRatingsStore = jest.mocked(useRatingsStore)
const mockLanguageStore= jest.mocked(useLanguageStore)
const mockApiFetch     = jest.mocked(apiFetch)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderCard(qc = makeQC()) {
  return render(
    <QueryClientProvider client={qc}>
      <StatsCard />
    </QueryClientProvider>
  )
}

const LANGUAGE_STATE = { language: 'en' } as LanguageState

function setupLanguage() {
  mockLanguageStore.mockImplementation((fn?: (s: LanguageState) => unknown) =>
    fn ? fn(LANGUAGE_STATE) : LANGUAGE_STATE
  )
}

const EMPTY_WATCHED: WatchedState = {
  movies: {}, episodes: {}, seriesData: {},
  toggleMovie: jest.fn(), enrichMovie: jest.fn(), toggleEpisode: jest.fn(),
  markSeason: jest.fn(), purgeUpcomingMovies: jest.fn(), purgeUpcomingSeries: jest.fn(),
}

const EMPTY_RATINGS: RatingsState = {
  ratings: {}, setRating: jest.fn(), removeRating: jest.fn(),
}

// ─── Guest stats ──────────────────────────────────────────────────────────────

describe('StatsCard — guest', () => {
  beforeEach(() => {
    setupLanguage()
    mockUserStore.mockImplementation((fn) => fn({ userId: 'u1', role: 'guest' } as UserState))
    mockWatchedStore.mockImplementation((fn) => fn(EMPTY_WATCHED))
    mockRatingsStore.mockImplementation((fn) => fn(EMPTY_RATINGS))
  })

  it('renders guest title', () => {
    renderCard()
    expect(screen.getByText('My activity')).toBeInTheDocument()
  })

  it('shows empty state when no activity', () => {
    renderCard()
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
  })

  it('shows 5 stat chips including series completion', () => {
    renderCard()
    expect(screen.getByText('Movies')).toBeInTheDocument()
    expect(screen.getByText('Sagas')).toBeInTheDocument()
    expect(screen.getByText('Series')).toBeInTheDocument()
    expect(screen.getByText('Episodes')).toBeInTheDocument()
    expect(screen.getByText('series completed')).toBeInTheDocument()
  })

  it('shows correct movie count from store', () => {
    mockWatchedStore.mockImplementation((fn) => fn({
      ...EMPTY_WATCHED,
      movies: { u1: { 1: { id: 1, title: 'A', watchedAt: Date.now() }, 2: { id: 2, title: 'B', watchedAt: Date.now() } } },
    } as unknown as WatchedState))
    renderCard()
    const twos = screen.getAllByText('2')
    expect(twos.length).toBeGreaterThanOrEqual(1)
  })

  it('shows dash for series completion when no series watched', () => {
    renderCard()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows avg rating with star in Resumen tab when ratings exist', () => {
    mockRatingsStore.mockImplementation((fn) => fn({
      ...EMPTY_RATINGS,
      ratings: { u1: { movies: { 1: 4, 2: 3 }, series: {} } },
    } as unknown as RatingsState))
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Summary' }))
    expect(screen.getByText('3.5★')).toBeInTheDocument()
  })

  it('shows activity chart when movies have been watched', () => {
    mockWatchedStore.mockImplementation((fn) => fn({
      ...EMPTY_WATCHED,
      movies: { u1: { 1: { id: 1, title: 'A', watchedAt: Date.now() } } },
    } as unknown as WatchedState))
    renderCard()
    expect(screen.getAllByText('Activity').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('chart')).toBeInTheDocument()
  })

  it('period toggle starts at weekly with correct aria-pressed', () => {
    mockWatchedStore.mockImplementation((fn) => fn({
      ...EMPTY_WATCHED,
      movies: { u1: { 1: { id: 1, title: 'A', watchedAt: Date.now() } } },
    } as unknown as WatchedState))
    renderCard()
    expect(screen.getByRole('button', { name: 'week' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'day' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'month' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('updates aria-pressed when period changes', () => {
    mockWatchedStore.mockImplementation((fn) => fn({
      ...EMPTY_WATCHED,
      movies: { u1: { 1: { id: 1, title: 'A', watchedAt: Date.now() } } },
    } as unknown as WatchedState))
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'month' }))
    expect(screen.getByRole('button', { name: 'month' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'week' })).toHaveAttribute('aria-pressed', 'false')
  })
})

// ─── Admin stats ──────────────────────────────────────────────────────────────

const MOCK_STATS = { total: 12, guests: 9, admins: 3, thisMonth: 1, byMonth: [], byWeek: [], byDay: [] }

describe('StatsCard — admin', () => {
  beforeEach(() => {
    setupLanguage()
    mockUserStore.mockImplementation((fn) => fn({ userId: 'a1', role: 'admin' } as UserState))
  })

  function mockStats(stats: typeof MOCK_STATS | null, reject = false) {
    if (reject) {
      mockApiFetch.mockResolvedValue({ json: () => Promise.reject(new Error('fail')) } as unknown as Response)
    } else {
      mockApiFetch.mockResolvedValue({ json: () => Promise.resolve(stats) } as unknown as Response)
    }
  }

  it('renders admin title', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}) as unknown as Promise<Response>)
    renderCard()
    expect(screen.getByText('Users')).toBeInTheDocument()
  })

  it('shows loading skeleton while fetching', () => {
    mockApiFetch.mockReturnValue(new Promise(() => {}) as unknown as Promise<Response>)
    renderCard()
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows error state when fetch fails', async () => {
    mockStats(null, true)
    renderCard()
    expect(await screen.findByText('Could not load data')).toBeInTheDocument()
  })

  it('shows user stat chips when data loads', async () => {
    mockStats(MOCK_STATS)
    renderCard()
    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText('Total users')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows registrations chart when total > 0', async () => {
    mockStats(MOCK_STATS)
    renderCard()
    expect(await screen.findByText('Registrations')).toBeInTheDocument()
    expect(screen.getByTestId('chart')).toBeInTheDocument()
  })

  it('shows no-users empty state when total is 0', async () => {
    mockStats({ ...MOCK_STATS, total: 0, guests: 0, admins: 0 })
    renderCard()
    expect(await screen.findByText('No users yet')).toBeInTheDocument()
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument()
  })

  it('period toggle starts at monthly with correct aria-pressed', async () => {
    mockStats(MOCK_STATS)
    renderCard()
    await screen.findByText('Registrations')
    expect(screen.getByRole('button', { name: 'month' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'week' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'day' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('updates aria-pressed when period changes', async () => {
    mockStats(MOCK_STATS)
    renderCard()
    await screen.findByText('Registrations')
    fireEvent.click(screen.getByRole('button', { name: 'week' }))
    expect(screen.getByRole('button', { name: 'week' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'month' })).toHaveAttribute('aria-pressed', 'false')
  })
})

// ─── Guest stats — Gustos tab ─────────────────────────────────────────────────

describe('StatsCard — guest Gustos tab', () => {
  beforeEach(() => {
    setupLanguage()
    mockUserStore.mockImplementation((fn) => fn({ userId: 'u1', role: 'guest' } as UserState))
    mockWatchedStore.mockImplementation((fn) => fn(EMPTY_WATCHED))
    mockRatingsStore.mockImplementation((fn) => fn(EMPTY_RATINGS))
  })

  it('tab toggle defaults to Activity aria-pressed=true', () => {
    renderCard()
    expect(screen.getByRole('button', { name: 'Activity' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Summary' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switching to Tastes flips aria-pressed', () => {
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Summary' }))
    expect(screen.getByRole('button', { name: 'Summary' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Activity' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('Tastes tab shows empty state when no data', () => {
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Summary' }))
    expect(screen.getByText('No insights yet')).toBeInTheDocument()
  })

  it('Activity tab shows series completion chip when series watched', () => {
    mockWatchedStore.mockImplementation((fn) => fn({
      ...EMPTY_WATCHED,
      episodes: { u1: { 10: { 1: { seasonNumber: 1 }, 2: { seasonNumber: 1 } } } },
      seriesData: { u1: { 10: { id: 10, name: 'S', first_air_date: '2010-01-01', vote_average: 8, vote_count: 100, poster_path: null, original_language: 'en', number_of_episodes: 2 } } },
    } as unknown as WatchedState))
    renderCard()
    expect(screen.getByText('series completed')).toBeInTheDocument()
    expect(screen.getByText('1/1')).toBeInTheDocument()
  })

  it('Tastes tab shows ratings chart when ratings exist', () => {
    mockRatingsStore.mockImplementation((fn) => fn({
      ...EMPTY_RATINGS,
      ratings: { u1: { movies: { 1: 4 }, series: {} } },
    } as unknown as RatingsState))
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Summary' }))
    expect(screen.getByText('My ratings')).toBeInTheDocument()
    expect(screen.getByTestId('chart')).toBeInTheDocument()
  })

  it('Tastes tab shows decade chart when movies exist', () => {
    mockWatchedStore.mockImplementation((fn) => fn({
      ...EMPTY_WATCHED,
      movies: { u1: { 1: { id: 1, title: 'A', release_date: '1995-01-01', vote_average: 7, vote_count: 100, poster_path: null, original_language: 'en', watchedAt: Date.now() } } },
    } as unknown as WatchedState))
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: 'Summary' }))
    expect(screen.getByText('By decade')).toBeInTheDocument()
  })
})

// ─── Pure functions ───────────────────────────────────────────────────────────

describe('buildRatingHistogram', () => {
  it('returns all zeros when no ratings', () => {
    const result = buildRatingHistogram({}, {})
    expect(result).toHaveLength(10)
    expect(result.every((r) => r.count === 0)).toBe(true)
  })

  it('counts movie ratings correctly', () => {
    const result = buildRatingHistogram({ 1: 4, 2: 4, 3: 5 }, {})
    expect(result.find((r) => r.name === '4★')?.count).toBe(2)
    expect(result.find((r) => r.name === '5★')?.count).toBe(1)
  })

  it('counts series ratings and combines with movies', () => {
    const result = buildRatingHistogram({ 1: 3 }, { 10: 3, 11: 4.5 })
    expect(result.find((r) => r.name === '3★')?.count).toBe(2)
    expect(result.find((r) => r.name === '4.5★')?.count).toBe(1)
  })

  it('returns entries for all 10 half-star steps', () => {
    const result = buildRatingHistogram({}, {})
    const names = result.map((r) => r.name)
    expect(names).toEqual(['0.5★', '1★', '1.5★', '2★', '2.5★', '3★', '3.5★', '4★', '4.5★', '5★'])
  })
})

describe('buildDecadeDistribution', () => {
  it('returns empty array when no titles', () => {
    expect(buildDecadeDistribution([], [])).toEqual([])
  })

  it('groups movies by decade', () => {
    const result = buildDecadeDistribution(
      [{ release_date: '1995-06-01' }, { release_date: '1998-01-01' }, { release_date: '2005-03-01' }],
      [],
    )
    expect(result.find((r) => r.name === '1990–99')?.count).toBe(2)
    expect(result.find((r) => r.name === '2000–09')?.count).toBe(1)
  })

  it('groups series by decade', () => {
    const result = buildDecadeDistribution([], [{ first_air_date: '2015-01-01' }])
    expect(result.find((r) => r.name === '2010–19')?.count).toBe(1)
  })

  it('combines movies and series', () => {
    const result = buildDecadeDistribution(
      [{ release_date: '2020-01-01' }],
      [{ first_air_date: '2021-01-01' }],
    )
    expect(result.find((r) => r.name === '2020–')?.count).toBe(2)
  })

  it('trims leading zero-count decades', () => {
    const result = buildDecadeDistribution([{ release_date: '2010-01-01' }], [])
    expect(result[0].name).toBe('2010–19')
  })

  it('handles missing dates gracefully', () => {
    const result = buildDecadeDistribution([{ release_date: '' }], [{ first_air_date: '' }])
    expect(result).toEqual([])
  })
})
