import { render, screen } from '@testing-library/react'
import WatchProviders from './WatchProviders'
import type { PaidProvider } from '@/hooks/useWatchProviders'
import type { WatchProvider } from '@/types/tmdb'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

jest.mock('@/utils/tmdb', () => ({
  getTMDBImageUrl: (_path: string | null) =>
    _path ? `https://image.tmdb.org/t/p/w92${_path}` : null,
}))

function flatrate(id: number, name: string): WatchProvider {
  return { provider_id: id, provider_name: name, logo_path: '/logo.png', display_priority: id }
}

function paid(id: number, name: string, source: 'rent' | 'buy'): PaidProvider {
  return { provider_id: id, provider_name: name, logo_path: '/logo.png', display_priority: id, source }
}

describe('WatchProviders', () => {
  it('renders nothing when there are no providers and not loading', () => {
    const { container } = render(
      <WatchProviders flatrate={[]} rent={[]} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when not loading and no inTheaters', () => {
    const { container } = render(
      <WatchProviders flatrate={[]} rent={[]} inTheaters={false} loading={false} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows loading skeleton while loading', () => {
    const { container } = render(
      <WatchProviders flatrate={[]} rent={[]} loading={true} />,
    )
    expect(screen.getByText('common.availableOn')).toBeInTheDocument()
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons).toHaveLength(2)
  })

  it('renders flatrate provider logos', () => {
    render(
      <WatchProviders flatrate={[flatrate(8, 'Netflix')]} rent={[]} />,
    )
    expect(screen.getByAltText('Netflix')).toBeInTheDocument()
  })

  it('renders paid providers with rent badge', () => {
    const { container } = render(
      <WatchProviders flatrate={[]} rent={[paid(2, 'Apple TV', 'rent')]} />,
    )
    expect(screen.getByAltText('Apple TV')).toBeInTheDocument()
    expect(container.querySelector('.bg-primary')).toBeInTheDocument()
    expect(container.textContent).toContain('€')
  })

  it('renders paid providers with buy badge (cart icon, no € text)', () => {
    const { container } = render(
      <WatchProviders flatrate={[]} rent={[paid(10, 'Amazon Video', 'buy')]} />,
    )
    expect(screen.getByAltText('Amazon Video')).toBeInTheDocument()
    expect(container.querySelector('.bg-primary')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.textContent).not.toContain('€')
  })

  it('shows the In theaters chip when inTheaters is true', () => {
    render(
      <WatchProviders flatrate={[]} rent={[]} inTheaters={true} />,
    )
    expect(screen.getByText('common.inTheaters')).toBeInTheDocument()
  })

  it('does not show the In theaters chip when inTheaters is false', () => {
    render(
      <WatchProviders flatrate={[flatrate(8, 'Netflix')]} rent={[]} inTheaters={false} />,
    )
    expect(screen.queryByText('common.inTheaters')).not.toBeInTheDocument()
  })

  it('renders both flatrate and paid providers together', () => {
    render(
      <WatchProviders
        flatrate={[flatrate(8, 'Netflix')]}
        rent={[paid(2, 'Apple TV', 'rent'), paid(10, 'Amazon Video', 'buy')]}
      />,
    )
    expect(screen.getByAltText('Netflix')).toBeInTheDocument()
    expect(screen.getByAltText('Apple TV')).toBeInTheDocument()
    expect(screen.getByAltText('Amazon Video')).toBeInTheDocument()
  })

  it('renders the Available on label when providers are present', () => {
    render(
      <WatchProviders flatrate={[flatrate(8, 'Netflix')]} rent={[]} />,
    )
    expect(screen.getByText('common.availableOn')).toBeInTheDocument()
  })

  it('tooltip for flatrate provider shows only the provider name', () => {
    render(
      <WatchProviders flatrate={[flatrate(8, 'Netflix')]} rent={[]} />,
    )
    expect(screen.getByText('Netflix')).toBeInTheDocument()
  })

  it('tooltip for rent provider appends the rent label', () => {
    render(
      <WatchProviders flatrate={[]} rent={[paid(2, 'Apple TV', 'rent')]} />,
    )
    expect(screen.getByText('Apple TV (common.rent)')).toBeInTheDocument()
  })

  it('tooltip for buy provider appends the buy label', () => {
    render(
      <WatchProviders flatrate={[]} rent={[paid(10, 'Amazon Video', 'buy')]} />,
    )
    expect(screen.getByText('Amazon Video (common.buy)')).toBeInTheDocument()
  })
})
