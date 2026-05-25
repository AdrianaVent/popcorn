import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('StatusBadge', () => {
  it('renders a loading skeleton when status is undefined', () => {
    const { container } = render(<StatusBadge status={undefined} />)
    const el = container.firstChild as HTMLElement
    expect(el.tagName).toBe('SPAN')
    expect(el.className).toMatch(/animate-pulse/)
  })

  it('renders the translated label key for a known status', () => {
    render(<StatusBadge status="Ended" />)
    expect(screen.getByText('series.status.ended')).toBeInTheDocument()
  })

  it('renders the em dash for an unknown status', () => {
    render(<StatusBadge status="SomeFutureStatus" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders the label for "Returning Series"', () => {
    render(<StatusBadge status="Returning Series" />)
    expect(screen.getByText('series.status.returning')).toBeInTheDocument()
  })

  it('renders the label for "In Production"', () => {
    render(<StatusBadge status="In Production" />)
    expect(screen.getByText('series.status.inProduction')).toBeInTheDocument()
  })
})
