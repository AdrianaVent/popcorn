import { render, screen } from '@testing-library/react'
import StatChip from './StatChip'

describe('StatChip', () => {
  it('renders the value', () => {
    render(<StatChip label="Movies" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders the label', () => {
    render(<StatChip label="Movies" value={42} />)
    expect(screen.getByText('Movies')).toBeInTheDocument()
  })

  it('renders string value', () => {
    render(<StatChip label="Completion" value="3/5" />)
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })

  it('renders suffix when provided', () => {
    render(<StatChip label="Rating" value="4.2" suffix="★" />)
    expect(screen.getByText('★')).toBeInTheDocument()
  })

  it('does not render suffix when omitted', () => {
    render(<StatChip label="Movies" value={42} />)
    expect(screen.queryByText('★')).not.toBeInTheDocument()
  })
})
