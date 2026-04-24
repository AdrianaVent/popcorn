import { getSeriesUI } from './getSeriesUI'
import type { TMDBSeriesDetail } from '@/types/tmdb'

const base: Partial<TMDBSeriesDetail> = {
  status: 'Returning Series',
  first_air_date: '2020-03-15',
  episode_run_time: [45],
}

describe('getSeriesUI', () => {
  it('returns null statusConfig when detail is null', () => {
    expect(getSeriesUI(null)).toEqual({ statusConfig: null, firstAirYear: null, avgRuntime: null })
  })

  it('returns null statusConfig when detail is undefined', () => {
    expect(getSeriesUI(undefined)).toEqual({ statusConfig: null, firstAirYear: null, avgRuntime: null })
  })

  it('returns statusConfig for Returning Series', () => {
    const result = getSeriesUI(base as TMDBSeriesDetail)
    expect(result.statusConfig?.labelKey).toBe('series.status.returning')
  })

  it('returns statusConfig for Ended', () => {
    const result = getSeriesUI({ ...base, status: 'Ended' } as TMDBSeriesDetail)
    expect(result.statusConfig?.labelKey).toBe('series.status.ended')
  })

  it('returns statusConfig for Canceled', () => {
    const result = getSeriesUI({ ...base, status: 'Canceled' } as TMDBSeriesDetail)
    expect(result.statusConfig?.labelKey).toBe('series.status.canceled')
  })

  it('returns statusConfig for In Production', () => {
    const result = getSeriesUI({ ...base, status: 'In Production' } as TMDBSeriesDetail)
    expect(result.statusConfig?.labelKey).toBe('series.status.inProduction')
  })

  it('returns null statusConfig for unknown status', () => {
    const result = getSeriesUI({ ...base, status: 'Unknown' } as TMDBSeriesDetail)
    expect(result.statusConfig).toBeNull()
  })

  it('extracts the correct first air year', () => {
    const result = getSeriesUI(base as TMDBSeriesDetail)
    expect(result.firstAirYear).toBe(2020)
  })

  it('returns null firstAirYear when first_air_date is empty', () => {
    const result = getSeriesUI({ ...base, first_air_date: '' } as TMDBSeriesDetail)
    expect(result.firstAirYear).toBeNull()
  })

  it('extracts avgRuntime from the first element', () => {
    const result = getSeriesUI(base as TMDBSeriesDetail)
    expect(result.avgRuntime).toBe(45)
  })

  it('returns null avgRuntime when episode_run_time is empty', () => {
    const result = getSeriesUI({ ...base, episode_run_time: [] } as TMDBSeriesDetail)
    expect(result.avgRuntime).toBeNull()
  })
})
