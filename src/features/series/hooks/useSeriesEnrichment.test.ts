import { renderHook, waitFor } from '@testing-library/react'
import { useSeriesEnrichment } from './useSeriesEnrichment'
import { fetchSeriesDetail, fetchSeasonDetail } from '@/features/series/series.service'
import type { SeriesRow } from '@/types/series'
import type { TMDBSeriesDetail } from '@/types/tmdb'

jest.mock('@/features/series/series.service', () => ({
  fetchSeriesDetail: jest.fn(),
  fetchSeasonDetail: jest.fn(),
}))

const mockFetchDetail = fetchSeriesDetail as jest.MockedFunction<typeof fetchSeriesDetail>
const mockFetchSeason = fetchSeasonDetail as jest.MockedFunction<typeof fetchSeasonDetail>

const makeRow = (id: number): SeriesRow => ({
  id,
  name: `Series ${id}`,
  first_air_date: '2020-01-01',
  vote_average: 8,
  vote_count: 1000,
  poster_path: null,
  original_language: 'en',
})

const makeDetail = (overrides: Partial<TMDBSeriesDetail> = {}): TMDBSeriesDetail => ({
  id: 1,
  name: 'Test Series',
  original_name: 'Test Series',
  overview: '',
  first_air_date: '2020-01-01',
  vote_average: 8,
  vote_count: 1000,
  poster_path: null,
  original_language: 'en',
  genre_ids: [],
  status: 'Ended',
  number_of_seasons: 1,
  number_of_episodes: 10,
  episode_run_time: [45],
  seasons: [{ id: 10, name: 'Season 1', season_number: 1, episode_count: 10, poster_path: null, air_date: '2020-01-01', overview: '' }],
  genres: [{ id: 18, name: 'Drama' }],
  tagline: '',
  ...overrides,
} as TMDBSeriesDetail)

describe('useSeriesEnrichment', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns empty maps when visibleSeries is empty', () => {
    const { result } = renderHook(() => useSeriesEnrichment([], 'en'))
    expect(result.current.statuses.size).toBe(0)
    expect(result.current.totals.size).toBe(0)
    expect(result.current.runtimes.size).toBe(0)
    expect(result.current.genreIds.size).toBe(0)
  })

  it('populates status, totals and runtime from detail', async () => {
    const detail = makeDetail({ id: 1, status: 'Ended', episode_run_time: [45], seasons: [
      { id: 10, name: 'Season 1', season_number: 1, episode_count: 10, poster_path: null, air_date: '2020-01-01', overview: '' },
    ]})
    mockFetchDetail.mockResolvedValueOnce(detail)

    const series = [makeRow(1)]
    const { result } = renderHook(() => useSeriesEnrichment(series, 'en'))
    await waitFor(() => expect(result.current.statuses.size).toBe(1))

    expect(result.current.statuses.get(1)).toBe('Ended')
    expect(result.current.totals.get(1)).toBe(10)
    expect(result.current.runtimes.get(1)).toBe(450) // 45 * 10
  })

  it('backfills genreIds from detail.genres', async () => {
    const detail = makeDetail({ id: 1, genres: [{ id: 18, name: 'Drama' }, { id: 10759, name: 'Action' }] })
    mockFetchDetail.mockResolvedValueOnce(detail)

    const series = [makeRow(1)]
    const { result } = renderHook(() => useSeriesEnrichment(series, 'en'))
    await waitFor(() => expect(result.current.genreIds.size).toBe(1))

    expect(result.current.genreIds.get(1)).toEqual([18, 10759])
  })

  it('does not set genreIds when detail has no genres', async () => {
    const detail = makeDetail({ id: 1, genres: [] })
    mockFetchDetail.mockResolvedValueOnce(detail)

    const series = [makeRow(1)]
    const { result } = renderHook(() => useSeriesEnrichment(series, 'en'))
    await waitFor(() => expect(result.current.statuses.size).toBe(1))

    expect(result.current.genreIds.has(1)).toBe(false)
  })

  it('sets runtime to null when epRt is null and no seasons', async () => {
    const detail = makeDetail({ id: 1, episode_run_time: [], last_episode_to_air: undefined, seasons: [] })
    mockFetchDetail.mockResolvedValueOnce(detail)

    const series = [makeRow(1)]
    const { result } = renderHook(() => useSeriesEnrichment(series, 'en'))
    await waitFor(() => expect(result.current.runtimes.size).toBe(1))

    expect(result.current.runtimes.get(1)).toBeNull()
  })

  it('falls back to season episode average when episode_run_time is missing', async () => {
    const detail = makeDetail({ id: 1, episode_run_time: [], last_episode_to_air: undefined, seasons: [
      { id: 10, name: 'Season 1', season_number: 1, episode_count: 2, poster_path: null, air_date: '2020-01-01', overview: '' },
    ]})
    mockFetchDetail.mockResolvedValueOnce(detail)
    mockFetchSeason.mockResolvedValueOnce({
      episodes: [
        { id: 1, episode_number: 1, runtime: 50, name: 'Ep1', air_date: '2020-01-01' },
        { id: 2, episode_number: 2, runtime: 60, name: 'Ep2', air_date: '2020-01-08' },
      ],
    } as never)

    const series = [makeRow(1)]
    const { result } = renderHook(() => useSeriesEnrichment(series, 'en'))
    await waitFor(() => expect(result.current.runtimes.size).toBe(1))

    // avg = (50+60)/2 = 55, total = 55 * 2 = 110
    expect(result.current.runtimes.get(1)).toBe(110)
  })

  it('handles failed detail fetch gracefully', async () => {
    mockFetchDetail.mockRejectedValueOnce(new Error('network error'))

    const series = [makeRow(1)]
    const { result } = renderHook(() => useSeriesEnrichment(series, 'en'))
    await new Promise((r) => setTimeout(r, 50))
    expect(result.current.statuses.size).toBe(0)
    expect(result.current.genreIds.size).toBe(0)
  })

  it('enriches multiple series independently', async () => {
    mockFetchDetail
      .mockResolvedValueOnce(makeDetail({ id: 1, status: 'Ended', genres: [{ id: 18, name: 'Drama' }], episode_run_time: [30], seasons: [
        { id: 10, name: 'Season 1', season_number: 1, episode_count: 5, poster_path: null, air_date: '2020-01-01', overview: '' },
      ]}))
      .mockResolvedValueOnce(makeDetail({ id: 2, status: 'Returning Series', genres: [{ id: 35, name: 'Comedy' }], episode_run_time: [20], seasons: [
        { id: 20, name: 'Season 1', season_number: 1, episode_count: 10, poster_path: null, air_date: '2021-01-01', overview: '' },
      ]}))

    const series = [makeRow(1), makeRow(2)]
    const { result } = renderHook(() => useSeriesEnrichment(series, 'en'))
    await waitFor(() => expect(result.current.statuses.size).toBe(2))

    expect(result.current.statuses.get(1)).toBe('Ended')
    expect(result.current.statuses.get(2)).toBe('Returning Series')
    expect(result.current.runtimes.get(1)).toBe(150)  // 30 * 5
    expect(result.current.runtimes.get(2)).toBe(200)  // 20 * 10
    expect(result.current.genreIds.get(1)).toEqual([18])
    expect(result.current.genreIds.get(2)).toEqual([35])
  })
})
