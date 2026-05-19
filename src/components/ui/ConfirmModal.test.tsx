import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmModal from './ConfirmModal'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const defaultProps = {
  title: 'Delete user',
  description: 'Are you sure?',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
}

describe('ConfirmModal', () => {
  describe('rendering', () => {
    it('renders the title', () => {
      render(<ConfirmModal {...defaultProps} />)
      expect(screen.getByText('Delete user')).toBeInTheDocument()
    })

    it('renders the description', () => {
      render(<ConfirmModal {...defaultProps} />)
      expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    })

    it('shows custom confirmLabel when provided', () => {
      render(<ConfirmModal {...defaultProps} confirmLabel="Remove" />)
      expect(screen.getByText('Remove')).toBeInTheDocument()
    })

    it('falls back to common.confirm when no confirmLabel', () => {
      render(<ConfirmModal {...defaultProps} />)
      expect(screen.getByText('common.confirm')).toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      const onConfirm = jest.fn()
      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)
      fireEvent.click(screen.getByText('common.confirm'))
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = jest.fn()
      render(<ConfirmModal {...defaultProps} onCancel={onCancel} />)
      fireEvent.click(screen.getByText('button.cancel'))
      expect(onCancel).toHaveBeenCalledTimes(1)
    })

    it('does not call onCancel when backdrop is clicked', () => {
      const onCancel = jest.fn()
      render(<ConfirmModal {...defaultProps} onCancel={onCancel} />)
      fireEvent.click(screen.getByRole('dialog'))
      expect(onCancel).not.toHaveBeenCalled()
    })

    it('does not call onCancel when Escape key is pressed', () => {
      const onCancel = jest.fn()
      render(<ConfirmModal {...defaultProps} onCancel={onCancel} />)
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onCancel).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('shows loading indicator on confirm button', () => {
      render(<ConfirmModal {...defaultProps} loading />)
      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('disables the cancel button while loading', () => {
      render(<ConfirmModal {...defaultProps} loading />)
      expect(screen.getByText('button.cancel').closest('button')).toBeDisabled()
    })

    it('disables the confirm button while loading', () => {
      render(<ConfirmModal {...defaultProps} loading />)
      expect(screen.getByText('...').closest('button')).toBeDisabled()
    })
  })
})
