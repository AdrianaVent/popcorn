import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal'

const renderModal = (onClose = jest.fn()) =>
  render(
    <Modal title="Test Modal" onClose={onClose}>
      <p>Modal content</p>
    </Modal>
  )

describe('Modal', () => {
  it('renders the title', () => {
    renderModal()
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('renders children', () => {
    renderModal()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn()
    renderModal(onClose)
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = jest.fn()
    renderModal(onClose)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onClose when modal content is clicked', () => {
    const onClose = jest.fn()
    renderModal(onClose)
    fireEvent.click(screen.getByText('Modal content'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = jest.fn()
    renderModal(onClose)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does NOT call onClose for other key presses', () => {
    const onClose = jest.fn()
    renderModal(onClose)
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
