import { render, screen, fireEvent } from '@testing-library/react'
import StarRating from './StarRating'

describe('StarRating', () => {
  it('renders 5 stars', () => {
    const { container } = render(<StarRating value={null} />)
    expect(container.querySelectorAll('svg')).toHaveLength(5)
  })

  it('sets aria-valuenow to 0 when value is null', () => {
    render(<StarRating value={null} />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '0')
  })

  it('sets aria-valuenow to current rating', () => {
    render(<StarRating value={3.5} />)
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '3.5')
  })

  it('does not render a slider role when readonly', () => {
    render(<StarRating value={4} readonly />)
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('calls onChange when a star is clicked', () => {
    const onChange = jest.fn()
    const { container } = render(<StarRating value={null} onChange={onChange} />)
    fireEvent.click(container.querySelectorAll('svg')[2])
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('does not call onChange when readonly', () => {
    const onChange = jest.fn()
    const { container } = render(<StarRating value={3} readonly onChange={onChange} />)
    fireEvent.click(container.querySelectorAll('svg')[0])
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not throw when clicked without onChange', () => {
    const { container } = render(<StarRating value={null} />)
    expect(() => fireEvent.click(container.querySelectorAll('svg')[0])).not.toThrow()
  })

  it('updates hovered value on mouse move', () => {
    const { container } = render(<StarRating value={null} />)
    const star = container.querySelectorAll('svg')[4]
    fireEvent.mouseMove(star, { clientX: 0 })
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '0')
  })

  it('clears hovered value on mouse leave', () => {
    const { container } = render(<StarRating value={2} />)
    const wrapper = screen.getByRole('slider')
    fireEvent.mouseMove(container.querySelectorAll('svg')[4])
    fireEvent.mouseLeave(wrapper)
    expect(wrapper).toHaveAttribute('aria-valuenow', '2')
  })
})
