import { render, screen, fireEvent } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import MediaCard from './MediaCard'

expect.extend(toHaveNoViolations)

const AXE_OPTS = { rules: { 'color-contrast': { enabled: false } } }

jest.mock('@/components/common/MediaPoster', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <img src="/mock.jpg" alt={title} />,
}))

jest.mock('@/hooks/useTruncated', () => ({
  useTruncated: () => ({ ref: { current: null }, isTruncated: false }),
}))

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('MediaCard — axe', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <MediaCard posterPath="/test.jpg" title="Test Movie" onClick={jest.fn()} />
    )
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('MediaCard — ARIA', () => {
  it('poster button has aria-label matching the title', () => {
    render(<MediaCard posterPath="/test.jpg" title="Inception" onClick={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'Inception' })).toBeInTheDocument()
  })

  it('calls onClick when poster button is pressed', () => {
    const onClick = jest.fn()
    render(<MediaCard posterPath="/test.jpg" title="Inception" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Inception' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders children inside the card', () => {
    render(
      <MediaCard posterPath="/test.jpg" title="Test" onClick={jest.fn()}>
        <span data-testid="child">child</span>
      </MediaCard>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('applies ring-2 ring-primary class when isSelected', () => {
    render(<MediaCard posterPath="/test.jpg" title="Test" onClick={jest.fn()} isSelected />)
    expect(screen.getByRole('button', { name: 'Test' }).className).toContain('ring-2 ring-primary')
  })

  it('does not apply standalone ring when not selected', () => {
    render(<MediaCard posterPath="/test.jpg" title="Test" onClick={jest.fn()} isSelected={false} />)
    expect(screen.getByRole('button', { name: 'Test' }).className).not.toContain('ring-2 ring-primary')
  })
})
