import { render, screen, fireEvent } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import Modal from './Modal'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: { 'color-contrast': { enabled: false } },
}

const renderModal = (onClose = jest.fn()) =>
  render(
    <Modal title="Test Modal" onClose={onClose}>
      <p>Modal content</p>
    </Modal>
  )

describe('Modal — axe', () => {
  it('has no axe violations', async () => {
    const { container } = render(
      <Modal title="Test Modal" onClose={jest.fn()}>
        <p>Modal content</p>
      </Modal>
    )
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('has no axe violations with footer', async () => {
    const { container } = render(
      <Modal title="Test Modal" onClose={jest.fn()} footer={<div><button>OK</button></div>}>
        <p>content</p>
      </Modal>
    )
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('Modal — ARIA', () => {
  it('has role="dialog" and aria-modal="true"', () => {
    render(<Modal title="Test Modal" onClose={jest.fn()}><p>content</p></Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('close button label uses i18n key', () => {
    render(<Modal title="Test Modal" onClose={jest.fn()}><p>content</p></Modal>)
    expect(screen.getByRole('button', { name: 'common.close' })).toBeInTheDocument()
  })
})

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
    fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
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
