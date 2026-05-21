import { render, screen } from '@testing-library/react'
import GenreGrid from './GenreGrid'

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

// Simulates the unified genre map: Action (28) and Adventure (12) → same name
const RESOLVED: Record<number, string> = {
  18:  'Drama',
  35:  'Comedy',
  28:  'Action & Adventure',
  12:  'Action & Adventure', // same as 28 — merged
  878: 'Sci-Fi & Fantasy',
  14:  'Sci-Fi & Fantasy',  // same as 878 — merged
}

jest.mock('@/config/genres', () => ({
  resolveGenreName: (id: number, _language: string, fallback?: string) =>
    RESOLVED[id] ?? fallback ?? `Genre-${id}`,
}))

const DramaIcon  = () => <svg data-testid="drama-icon" />
const ActionIcon = () => <svg data-testid="action-icon" />

jest.mock('@/config/genreIcons', () => ({
  getGenreIcon: (id: number) => {
    if (id === 18)  return DramaIcon
    if (id === 28 || id === 12) return ActionIcon  // same icon for merged genres
    return null
  },
}))

describe('GenreGrid', () => {
  it('renders nothing when genres list is empty', () => {
    const { container } = render(<GenreGrid genres={[]} label="Genres" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the label', () => {
    render(<GenreGrid genres={[{ id: 18, name: 'Drama' }]} label="Genres" />)
    expect(screen.getByText('Genres')).toBeInTheDocument()
  })

  it('renders genre names using the fallback name', () => {
    render(<GenreGrid genres={[{ id: 18, name: 'Drama' }]} label="Genres" />)
    expect(screen.getByText('Drama')).toBeInTheDocument()
  })

  it('renders multiple genres', () => {
    render(
      <GenreGrid
        genres={[{ id: 18, name: 'Drama' }, { id: 35, name: 'Comedy' }]}
        label="Genres"
      />
    )
    expect(screen.getByText('Drama')).toBeInTheDocument()
    expect(screen.getByText('Comedy')).toBeInTheDocument()
  })

  it('renders the icon for genres that have one', () => {
    render(<GenreGrid genres={[{ id: 18, name: 'Drama' }]} label="Genres" />)
    expect(screen.getByTestId('drama-icon')).toBeInTheDocument()
  })

  it('does not render an icon for genres without one', () => {
    render(<GenreGrid genres={[{ id: 35, name: 'Comedy' }]} label="Genres" />)
    expect(screen.queryByTestId('drama-icon')).not.toBeInTheDocument()
  })

  describe('name deduplication (merged genres)', () => {
    it('renders only one badge when two IDs resolve to the same name', () => {
      render(
        <GenreGrid
          genres={[{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }]}
          label="Genres"
        />
      )
      expect(screen.getAllByText('Action & Adventure')).toHaveLength(1)
    })

    it('renders only one badge for each merged pair — Avatar case [28, 12, 878, 14]', () => {
      render(
        <GenreGrid
          genres={[
            { id: 28,  name: 'Action' },
            { id: 12,  name: 'Adventure' },
            { id: 878, name: 'Science Fiction' },
            { id: 14,  name: 'Fantasy' },
          ]}
          label="Genres"
        />
      )
      expect(screen.getAllByText('Action & Adventure')).toHaveLength(1)
      expect(screen.getAllByText('Sci-Fi & Fantasy')).toHaveLength(1)
      expect(screen.getAllByText(/Action|Adventure|Science|Fantasy/)).toHaveLength(2)
    })

    it('renders the icon only once when two merged IDs share the same icon', () => {
      render(
        <GenreGrid
          genres={[{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }]}
          label="Genres"
        />
      )
      expect(screen.getAllByTestId('action-icon')).toHaveLength(1)
    })

    it('still renders distinct genres that share no name', () => {
      render(
        <GenreGrid
          genres={[
            { id: 28, name: 'Action' },
            { id: 18, name: 'Drama' },
          ]}
          label="Genres"
        />
      )
      expect(screen.getByText('Action & Adventure')).toBeInTheDocument()
      expect(screen.getByText('Drama')).toBeInTheDocument()
    })
  })
})
