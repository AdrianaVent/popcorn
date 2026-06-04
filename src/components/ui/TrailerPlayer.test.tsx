import { render, screen, fireEvent } from '@testing-library/react'
import TrailerPlayer from './TrailerPlayer'

describe('TrailerPlayer', () => {
  it('renders an iframe with the correct YouTube embed src', () => {
    render(<TrailerPlayer trailerKey="abc123" />)
    const iframe = screen.getByTitle('common.trailer')
    expect(iframe).toHaveAttribute('src', expect.stringContaining('abc123'))
  })

  it('does not render a close button when onClose is not provided', () => {
    render(<TrailerPlayer trailerKey="abc123" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders a close button when onClose is provided', () => {
    render(<TrailerPlayer trailerKey="abc123" onClose={() => {}} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn()
    render(<TrailerPlayer trailerKey="abc123" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('applies a custom className to the wrapper', () => {
    const { container } = render(<TrailerPlayer trailerKey="abc123" className="my-custom-class" />)
    expect(container.firstChild).toHaveClass('my-custom-class')
  })
})
