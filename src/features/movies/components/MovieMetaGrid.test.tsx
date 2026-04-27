import { render, screen } from '@testing-library/react'
import MovieMetaGrid from './MovieMetaGrid'
import type { TMDBMovieDetail } from '@/types/tmdb'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

const detail: Partial<TMDBMovieDetail> = {
  vote_average: 8.4,
  vote_count: 35000,
  runtime: 148,
  genres: [{ id: 28, name: 'Action' }],
}

const released = { isUpcoming: false, releaseYear: 2010 }
const upcoming = { isUpcoming: true,  releaseYear: 2099 }

describe('MovieMetaGrid', () => {
  describe('released movie', () => {
    it('shows rating', () => {
      render(<MovieMetaGrid detail={detail as TMDBMovieDetail} {...released} />)
      expect(screen.getByText('movies.detail.rating')).toBeInTheDocument()
    })

    it('shows votes', () => {
      render(<MovieMetaGrid detail={detail as TMDBMovieDetail} {...released} />)
      expect(screen.getByText('movies.detail.votes')).toBeInTheDocument()
    })

    it('shows runtime when available', () => {
      render(<MovieMetaGrid detail={detail as TMDBMovieDetail} {...released} />)
      expect(screen.getByText('movies.detail.runtime')).toBeInTheDocument()
    })

    it('hides runtime when null', () => {
      render(
        <MovieMetaGrid
          detail={{ ...detail, runtime: null } as TMDBMovieDetail}
          {...released}
        />
      )
      expect(screen.queryByText('movies.detail.runtime')).not.toBeInTheDocument()
    })

    it('shows release year', () => {
      render(<MovieMetaGrid detail={detail as TMDBMovieDetail} {...released} />)
      expect(screen.getByText('movies.detail.year')).toBeInTheDocument()
    })
  })

  describe('upcoming movie', () => {
    it('hides rating', () => {
      render(<MovieMetaGrid detail={detail as TMDBMovieDetail} {...upcoming} />)
      expect(screen.queryByText('movies.detail.rating')).not.toBeInTheDocument()
    })

    it('hides votes', () => {
      render(<MovieMetaGrid detail={detail as TMDBMovieDetail} {...upcoming} />)
      expect(screen.queryByText('movies.detail.votes')).not.toBeInTheDocument()
    })

    it('hides runtime', () => {
      render(<MovieMetaGrid detail={detail as TMDBMovieDetail} {...upcoming} />)
      expect(screen.queryByText('movies.detail.runtime')).not.toBeInTheDocument()
    })

    it('hides release year', () => {
      render(<MovieMetaGrid detail={detail as TMDBMovieDetail} {...upcoming} />)
      expect(screen.queryByText('movies.detail.year')).not.toBeInTheDocument()
    })

    it('still shows genres', () => {
      render(<MovieMetaGrid detail={detail as TMDBMovieDetail} {...upcoming} />)
      expect(screen.getByText('Action')).toBeInTheDocument()
    })
  })
})
