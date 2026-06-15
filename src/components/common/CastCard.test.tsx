import { render, screen, fireEvent } from '@testing-library/react'
import CastCard from './CastCard'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onError }: { src: string; alt: string; onError: () => void }) =>
    <img src={src} alt={alt} onError={onError} />,
}))

jest.mock('@/utils/tmdb', () => ({
  getTMDBImageUrl: (path: string | null) => (path ? `https://image.tmdb.org/t/p/w185${path}` : null),
}))

describe('CastCard', () => {
  it('renders actor image when profilePath is provided', () => {
    render(<CastCard name="John Doe" sub="Hero" profilePath="/john.jpg" />)
    expect(screen.getByRole('img', { name: 'John Doe' })).toBeInTheDocument()
  })

  it('renders placeholder SVG when profilePath is null', () => {
    const { container } = render(<CastCard name="John Doe" sub="Hero" profilePath={null} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('shows placeholder after image error', () => {
    const { container } = render(<CastCard name="John Doe" sub="Hero" profilePath="/broken.jpg" />)
    const img = screen.getByRole('img')
    fireEvent.error(img)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders name and sub text', () => {
    render(<CastCard name="Jane Smith" sub="Villain" profilePath={null} />)
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Villain')).toBeInTheDocument()
  })
})
