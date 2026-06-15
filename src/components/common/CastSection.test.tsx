import { render, screen, fireEvent } from '@testing-library/react'
import CastSection from './CastSection'
import type { TMDBCastMember, TMDBCrewMember } from '@/types/tmdb'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count !== undefined ? `${key}:${opts.count}` : key,
  }),
}))

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

jest.mock('@/utils/tmdb', () => ({
  getTMDBImageUrl: (path: string | null) => (path ? `https://image.tmdb.org/t/p/w185${path}` : null),
}))

const makeCast = (n: number): TMDBCastMember[] =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `Actor ${i + 1}`,
    character: `Character ${i + 1}`,
    profile_path: `/actor${i + 1}.jpg`,
    order: i,
  }))

const makeCrew = (job: string): TMDBCrewMember[] => [
  { id: 99, name: 'Jane Director', job, department: 'Directing', profile_path: null },
]

describe('CastSection', () => {
  it('returns null when cast and crew are empty and no creators', () => {
    const { container } = render(<CastSection cast={[]} crew={[]} mediaType="movie" />)
    expect(container.firstChild).toBeNull()
  })

  it('shows section title when cast is present', () => {
    render(<CastSection cast={makeCast(3)} crew={[]} mediaType="movie" />)
    expect(screen.getByText('cast.title')).toBeInTheDocument()
  })

  it('shows up to 8 cast members without the expand button when exactly 8', () => {
    render(<CastSection cast={makeCast(8)} crew={[]} mediaType="movie" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(8)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows all cast when fewer than 8', () => {
    render(<CastSection cast={makeCast(4)} crew={[]} mediaType="movie" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('shows 8 cast listitems and expand button in header when more than 8', () => {
    render(<CastSection cast={makeCast(12)} crew={[]} mediaType="movie" />)
    expect(screen.getAllByRole('listitem')).toHaveLength(8)
    expect(screen.getByRole('button', { name: /cast\.showMore/ })).toBeInTheDocument()
  })

  it('expand button shows "+" without count', () => {
    render(<CastSection cast={makeCast(12)} crew={[]} mediaType="movie" />)
    expect(screen.getByText('+')).toBeInTheDocument()
  })

  it('shows all cast after clicking expand button', () => {
    render(<CastSection cast={makeCast(12)} crew={[]} mediaType="movie" />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getAllByRole('listitem')).toHaveLength(12)
  })

  it('collapses back to 8 on second click and shows "+" again', () => {
    render(<CastSection cast={makeCast(12)} crew={[]} mediaType="movie" />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getAllByRole('listitem')).toHaveLength(8)
    expect(screen.getByText('+')).toBeInTheDocument()
  })

  it('shows director for movies when crew has a Director', () => {
    render(<CastSection cast={[]} crew={makeCrew('Director')} mediaType="movie" />)
    expect(screen.getByText('Jane Director')).toBeInTheDocument()
    expect(screen.getByText(/cast\.director/)).toBeInTheDocument()
  })

  it('does not show Director row when crew has no Director', () => {
    render(<CastSection cast={[]} crew={makeCrew('Producer')} mediaType="movie" />)
    expect(screen.queryByText(/cast\.director/)).not.toBeInTheDocument()
  })

  it('shows creator label for series when creators are provided', () => {
    const creators = [{ id: 1, name: 'Show Creator', profile_path: null }]
    render(<CastSection cast={[]} crew={[]} creators={creators} mediaType="series" />)
    expect(screen.getByText('Show Creator')).toBeInTheDocument()
    expect(screen.getByText(/cast\.creator/)).toBeInTheDocument()
  })

  it('does not show creator label for movies', () => {
    const creators = [{ id: 1, name: 'Show Creator', profile_path: null }]
    render(<CastSection cast={[]} crew={[]} creators={creators} mediaType="movie" />)
    expect(screen.queryByText(/cast\.creator/)).not.toBeInTheDocument()
  })

  it('shows actor name and character', () => {
    render(<CastSection cast={makeCast(1)} crew={[]} mediaType="movie" />)
    expect(screen.getByText('Actor 1')).toBeInTheDocument()
    expect(screen.getByText('Character 1')).toBeInTheDocument()
  })

  it('renders cast list with list role', () => {
    render(<CastSection cast={makeCast(3)} crew={[]} mediaType="movie" />)
    expect(screen.getByRole('list')).toBeInTheDocument()
  })
})
