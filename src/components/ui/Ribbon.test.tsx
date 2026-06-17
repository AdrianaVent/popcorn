import { render, screen } from '@testing-library/react'
import Ribbon from './Ribbon'

describe('Ribbon', () => {
  it('renders the label', () => {
    render(<Ribbon label="Visto" colorClass="bg-primary text-primary-foreground" />)
    expect(screen.getByText('Visto')).toBeInTheDocument()
  })

  it('is aria-hidden', () => {
    const { container } = render(<Ribbon label="Visto" colorClass="bg-primary text-primary-foreground" />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies the colorClass', () => {
    const { container } = render(<Ribbon label="Visto" colorClass="bg-primary text-primary-foreground" />)
    expect(container.firstChild).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it('applies sm size classes', () => {
    const { container } = render(<Ribbon label="Visto" colorClass="bg-primary text-primary-foreground" size="sm" />)
    expect(container.firstChild).toHaveClass('top-1.5', '-left-5', 'w-14', 'pl-2')
  })

  it('applies md size classes by default', () => {
    const { container } = render(<Ribbon label="En progreso" colorClass="bg-primary text-primary-foreground" />)
    expect(container.firstChild).toHaveClass('top-3', '-left-6', 'w-24')
  })

  it('forwards data-cy attribute', () => {
    render(<Ribbon label="Visto" colorClass="bg-primary text-primary-foreground" data-cy="watched-ribbon" />)
    expect(document.querySelector('[data-cy="watched-ribbon"]')).toBeInTheDocument()
  })
})
