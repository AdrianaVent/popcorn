import { render, screen, fireEvent } from '@testing-library/react'
import MediaPoster from './MediaPoster'

/* eslint-disable @next/next/no-img-element */
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, loading, onError, width, height, className }: {
    src: string; alt: string; loading: string; onError: () => void
    width: number; height: number; className: string
  }) => <img src={src} alt={alt} data-loading={loading} onError={onError} width={width} height={height} className={className} />,
}))
/* eslint-enable @next/next/no-img-element */

jest.mock('@/utils/tmdb', () => ({
  getTMDBImageUrl: (path: string | null) => (path ? `https://image.tmdb.org/t/p/w92${path}` : null),
}))

describe('MediaPoster', () => {
  it('renders an image when posterPath is provided', () => {
    render(<MediaPoster posterPath="/test.jpg" title="Test Movie" />)
    expect(screen.getByRole('img', { name: 'Test Movie' })).toBeInTheDocument()
  })

  it('shows a placeholder when posterPath is null', () => {
    render(<MediaPoster posterPath={null} title="Test Movie" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('defaults to lazy loading', () => {
    render(<MediaPoster posterPath="/test.jpg" title="Test Movie" />)
    expect(screen.getByRole('img')).toHaveAttribute('data-loading', 'lazy')
  })

  it('accepts eager loading', () => {
    render(<MediaPoster posterPath="/test.jpg" title="Test Movie" loading="eager" />)
    expect(screen.getByRole('img')).toHaveAttribute('data-loading', 'eager')
  })

  it('shows a placeholder when the image fails to load', () => {
    render(<MediaPoster posterPath="/test.jpg" title="Test Movie" />)
    fireEvent.error(screen.getByRole('img', { name: 'Test Movie' }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('recovers from error if posterPath changes', () => {
    const { rerender } = render(<MediaPoster posterPath="/broken.jpg" title="Test Movie" />)
    fireEvent.error(screen.getByRole('img', { name: 'Test Movie' }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    rerender(<MediaPoster posterPath="/new.jpg" title="Test Movie" />)
    expect(screen.getByRole('img', { name: 'Test Movie' })).toBeInTheDocument()
  })
})
