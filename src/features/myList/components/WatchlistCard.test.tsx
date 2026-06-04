import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import WatchlistCard from './WatchlistCard'

expect.extend(toHaveNoViolations)

const AXE_OPTS = { rules: { 'color-contrast': { enabled: false } } }

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

jest.mock('@/components/common/MediaCard', () => ({
  __esModule: true,
  default: ({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) => (
    <div>
      <button onClick={onClick} aria-label={title}>{title}</button>
      {children}
    </div>
  ),
}))

jest.mock('@/components/icons', () => ({
  HeartIcon: () => <svg data-testid="heart-icon" />,
}))

describe('WatchlistCard — axe', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <WatchlistCard posterPath="/test.jpg" title="Dune" year={2021} onClick={jest.fn()} onRemove={jest.fn()} />
    )
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('WatchlistCard — rendering', () => {
  it('renders the title as button accessible name', () => {
    render(<WatchlistCard posterPath="/test.jpg" title="Dune" year={2021} onClick={jest.fn()} onRemove={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Dune' })).toBeInTheDocument()
  })

  it('renders the year when provided', () => {
    render(<WatchlistCard posterPath="/test.jpg" title="Dune" year={2021} onClick={jest.fn()} onRemove={jest.fn()} />)
    expect(screen.getByText('2021')).toBeInTheDocument()
  })

  it('does not render a year when null', () => {
    render(<WatchlistCard posterPath="/test.jpg" title="Dune" year={null} onClick={jest.fn()} onRemove={jest.fn()} />)
    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument()
  })

  it('remove button has an accessible label', () => {
    render(<WatchlistCard posterPath="/test.jpg" title="Dune" year={2021} onClick={jest.fn()} onRemove={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'myList.watchlist.remove' })).toBeInTheDocument()
  })

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = jest.fn()
    render(<WatchlistCard posterPath="/test.jpg" title="Dune" year={2021} onClick={jest.fn()} onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: 'myList.watchlist.remove' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('heart icon is wrapped in aria-hidden span', () => {
    const { container } = render(
      <WatchlistCard posterPath="/test.jpg" title="Dune" year={2021} onClick={jest.fn()} onRemove={jest.fn()} />
    )
    const hidden = container.querySelector('[aria-hidden="true"]')
    expect(hidden).not.toBeNull()
    expect(hidden?.querySelector('[data-testid="heart-icon"]')).not.toBeNull()
  })
})
