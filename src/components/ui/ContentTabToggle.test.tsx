import { render, screen, fireEvent } from '@testing-library/react'
import ContentTabToggle from './ContentTabToggle'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/components/icons', () => ({
  FilmIcon: () => <span data-testid="film-icon" />,
  TvIcon:  () => <span data-testid="tv-icon" />,
}))

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div data-tooltip={content}>{children}</div>
  ),
}))

describe('ContentTabToggle', () => {
  it('renders both icons', () => {
    render(<ContentTabToggle tab="movies" onTabChange={jest.fn()} />)
    expect(screen.getByTestId('film-icon')).toBeInTheDocument()
    expect(screen.getByTestId('tv-icon')).toBeInTheDocument()
  })

  it('calls onTabChange with movies when film button is clicked', () => {
    const onTabChange = jest.fn()
    render(<ContentTabToggle tab="series" onTabChange={onTabChange} />)
    fireEvent.click(screen.getByTestId('film-icon').closest('button')!)
    expect(onTabChange).toHaveBeenCalledWith('movies')
  })

  it('calls onTabChange with series when tv button is clicked', () => {
    const onTabChange = jest.fn()
    render(<ContentTabToggle tab="movies" onTabChange={onTabChange} />)
    fireEvent.click(screen.getByTestId('tv-icon').closest('button')!)
    expect(onTabChange).toHaveBeenCalledWith('series')
  })

  it('tooltip labels use nav keys', () => {
    const { container } = render(<ContentTabToggle tab="movies" onTabChange={jest.fn()} />)
    const tooltips = container.querySelectorAll('[data-tooltip]')
    expect(tooltips[0].getAttribute('data-tooltip')).toBe('nav.movies')
    expect(tooltips[1].getAttribute('data-tooltip')).toBe('nav.series')
  })
})
