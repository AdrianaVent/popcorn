import { render, screen, fireEvent } from '@testing-library/react'
import ColorSwatchGrid from './ColorSwatchGrid'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const COLORS = [
  { value: '111827', labelKey: 'color.black' },
  { value: 'ffffff', labelKey: 'color.white' },
  { value: '3b82f6', labelKey: 'color.blue'  },
]

describe('ColorSwatchGrid', () => {
  it('renders a button for each color', () => {
    render(<ColorSwatchGrid colors={COLORS} selected="111827" onSelect={jest.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('each button has aria-label from t(labelKey)', () => {
    render(<ColorSwatchGrid colors={COLORS} selected="111827" onSelect={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'color.black' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'color.white' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'color.blue'  })).toBeInTheDocument()
  })

  it('selected button has aria-pressed=true, others false', () => {
    render(<ColorSwatchGrid colors={COLORS} selected="3b82f6" onSelect={jest.fn()} />)
    expect(screen.getByRole('button', { name: 'color.blue'  })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'color.black' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'color.white' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows checkmark only on selected button', () => {
    render(<ColorSwatchGrid colors={COLORS} selected="111827" onSelect={jest.fn()} />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('calls onSelect with the correct value on click', () => {
    const onSelect = jest.fn()
    render(<ColorSwatchGrid colors={COLORS} selected="111827" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'color.blue' }))
    expect(onSelect).toHaveBeenCalledWith('3b82f6')
  })

  it('applies background color via inline style', () => {
    render(<ColorSwatchGrid colors={COLORS} selected="" onSelect={jest.fn()} />)
    const blackBtn = screen.getByRole('button', { name: 'color.black' })
    expect(blackBtn).toHaveStyle({ backgroundColor: '#111827' })
  })

  it('respects cols prop for grid layout', () => {
    const { container } = render(<ColorSwatchGrid colors={COLORS} selected="" onSelect={jest.fn()} cols={3} />)
    const grid = container.firstChild as HTMLElement
    expect(grid).toHaveStyle({ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' })
  })
})
