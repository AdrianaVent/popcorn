import { render, screen } from '@testing-library/react'
import SeriesMetaGrid from './SeriesMetaGrid'
import type { TMDBSeriesDetail } from '@/types/tmdb'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

const detail: Partial<TMDBSeriesDetail> = {
  vote_average: 8.9,
  vote_count: 12000,
  number_of_seasons: 5,
  number_of_episodes: 62,
  genres: [{ id: 18, name: 'Drama' }],
}

describe('SeriesMetaGrid', () => {
  it('shows rating', () => {
    render(<SeriesMetaGrid detail={detail as TMDBSeriesDetail} firstAirYear={2008} avgRuntime={45} />)
    expect(screen.getByText('series.detail.rating')).toBeInTheDocument()
  })

  it('shows votes', () => {
    render(<SeriesMetaGrid detail={detail as TMDBSeriesDetail} firstAirYear={2008} avgRuntime={45} />)
    expect(screen.getByText('series.detail.votes')).toBeInTheDocument()
  })

  it('shows seasons', () => {
    render(<SeriesMetaGrid detail={detail as TMDBSeriesDetail} firstAirYear={2008} avgRuntime={45} />)
    expect(screen.getByText('series.detail.seasons')).toBeInTheDocument()
  })

  it('shows episodes', () => {
    render(<SeriesMetaGrid detail={detail as TMDBSeriesDetail} firstAirYear={2008} avgRuntime={45} />)
    expect(screen.getByText('series.detail.episodes')).toBeInTheDocument()
  })

  it('shows runtime when provided', () => {
    render(<SeriesMetaGrid detail={detail as TMDBSeriesDetail} firstAirYear={2008} avgRuntime={45} />)
    expect(screen.getByText('series.detail.runtime')).toBeInTheDocument()
  })

  it('hides runtime when null', () => {
    render(<SeriesMetaGrid detail={detail as TMDBSeriesDetail} firstAirYear={2008} avgRuntime={null} />)
    expect(screen.queryByText('series.detail.runtime')).not.toBeInTheDocument()
  })

  it('shows first air year when provided', () => {
    render(<SeriesMetaGrid detail={detail as TMDBSeriesDetail} firstAirYear={2008} avgRuntime={null} />)
    expect(screen.getByText('series.detail.year')).toBeInTheDocument()
  })

  it('hides year when null', () => {
    render(<SeriesMetaGrid detail={detail as TMDBSeriesDetail} firstAirYear={null} avgRuntime={null} />)
    expect(screen.queryByText('series.detail.year')).not.toBeInTheDocument()
  })

  it('shows genres', () => {
    render(<SeriesMetaGrid detail={detail as TMDBSeriesDetail} firstAirYear={2008} avgRuntime={45} />)
    expect(screen.getByText('Drama')).toBeInTheDocument()
  })

  it('hides genres section when empty', () => {
    render(
      <SeriesMetaGrid
        detail={{ ...detail, genres: [] } as TMDBSeriesDetail}
        firstAirYear={2008}
        avgRuntime={45}
      />
    )
    expect(screen.queryByText('series.detail.genres')).not.toBeInTheDocument()
  })
})
