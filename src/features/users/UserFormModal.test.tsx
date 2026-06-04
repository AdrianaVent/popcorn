import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import UserFormModal from './UserFormModal'
import type { PublicUser } from '@/types/user'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/components/ui/Modal', () => {
  function MockModal({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
    return <div role="dialog" aria-label={title}><h2>{title}</h2>{children}{footer}</div>
  }
  return MockModal
})

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: { 'color-contrast': { enabled: false } },
}

const existingUser: PublicUser = {
  id: 'u1',
  username: 'alice',
  role: 'guest',
  created_at: 0,
  created_by: null,
}

const baseProps = {
  isSelf: false,
  onClose: jest.fn(),
  onSubmit: jest.fn().mockResolvedValue(undefined),
}

describe('UserFormModal — axe', () => {
  beforeEach(() => jest.clearAllMocks())

  it('has no axe violations in add mode', async () => {
    const { container } = render(<UserFormModal {...baseProps} />)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('has no axe violations in edit mode', async () => {
    const { container } = render(<UserFormModal {...baseProps} user={existingUser} />)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('has no axe violations when isSelf is true', async () => {
    const { container } = render(<UserFormModal {...baseProps} user={existingUser} isSelf />)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('UserFormModal — ARIA', () => {
  beforeEach(() => jest.clearAllMocks())

  it('username input is labelled', () => {
    render(<UserFormModal {...baseProps} />)
    expect(screen.getByLabelText('users.form.username')).toBeInTheDocument()
  })

  it('password input is labelled', () => {
    render(<UserFormModal {...baseProps} />)
    expect(screen.getByLabelText('users.form.password')).toBeInTheDocument()
  })

  it('role select is labelled', () => {
    render(<UserFormModal {...baseProps} />)
    expect(screen.getByLabelText('users.form.role')).toBeInTheDocument()
  })

  it('eye toggle button has accessible label when password is hidden', () => {
    render(<UserFormModal {...baseProps} />)
    expect(screen.getByLabelText('users.form.showPassword')).toBeInTheDocument()
  })

  it('eye toggle button label changes to hide after toggling', () => {
    render(<UserFormModal {...baseProps} />)
    fireEvent.click(screen.getByLabelText('users.form.showPassword'))
    expect(screen.getByLabelText('users.form.hidePassword')).toBeInTheDocument()
  })

  it('role select is disabled when isSelf is true', () => {
    render(<UserFormModal {...baseProps} user={existingUser} isSelf />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})

describe('UserFormModal', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows "add" title when no user is provided', () => {
    render(<UserFormModal {...baseProps} />)
    expect(screen.getByText('users.form.add')).toBeInTheDocument()
  })

  it('shows "edit" title when a user is provided', () => {
    render(<UserFormModal {...baseProps} user={existingUser} />)
    expect(screen.getByText('users.form.edit')).toBeInTheDocument()
  })

  it('pre-fills username and role in edit mode', () => {
    render(<UserFormModal {...baseProps} user={existingUser} />)
    expect(screen.getByLabelText('users.form.username')).toHaveValue('alice')
    expect(screen.getByRole('combobox')).toHaveValue('guest')
  })

  it('shows username error when submitted empty', async () => {
    render(<UserFormModal {...baseProps} />)
    fireEvent.click(screen.getByText('button.accept'))
    await waitFor(() =>
      expect(screen.getByText('login.validation.emailRequired')).toBeInTheDocument()
    )
    expect(baseProps.onSubmit).not.toHaveBeenCalled()
  })

  it('shows password error in create mode when password is empty', async () => {
    render(<UserFormModal {...baseProps} />)
    fireEvent.change(screen.getByLabelText('users.form.username'), { target: { value: 'bob' } })
    fireEvent.click(screen.getByText('button.accept'))
    await waitFor(() =>
      expect(screen.getByText('login.validation.passwordRequired')).toBeInTheDocument()
    )
  })

  it('shows password error when password does not meet requirements', async () => {
    render(<UserFormModal {...baseProps} />)
    fireEvent.change(screen.getByLabelText('users.form.username'), { target: { value: 'bob' } })
    fireEvent.change(screen.getByLabelText('users.form.password'), { target: { value: 'weak' } })
    fireEvent.click(screen.getByText('button.accept'))
    await waitFor(() =>
      expect(screen.getByText('login.validation.passwordInvalid')).toBeInTheDocument()
    )
  })

  it('does not require password in edit mode', async () => {
    render(<UserFormModal {...baseProps} user={existingUser} />)
    fireEvent.click(screen.getByText('button.accept'))
    await waitFor(() => expect(baseProps.onSubmit).toHaveBeenCalled())
  })

  it('disables the role select when isSelf is true', () => {
    render(<UserFormModal {...baseProps} user={existingUser} isSelf />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('calls onSubmit with trimmed username and selected role', async () => {
    render(<UserFormModal {...baseProps} />)
    fireEvent.change(screen.getByLabelText('users.form.username'), { target: { value: '  carol  ' } })
    fireEvent.change(screen.getByLabelText('users.form.password'), { target: { value: 'Valid1!pass' } })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'admin' } })
    fireEvent.click(screen.getByText('button.accept'))
    await waitFor(() =>
      expect(baseProps.onSubmit).toHaveBeenCalledWith({ username: 'carol', password: 'Valid1!pass', role: 'admin' })
    )
  })

  it('calls onClose after successful submit', async () => {
    render(<UserFormModal {...baseProps} user={existingUser} />)
    fireEvent.click(screen.getByText('button.accept'))
    await waitFor(() => expect(baseProps.onClose).toHaveBeenCalled())
  })

  it('displays server error when onSubmit rejects with unknown code', async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce(new Error('UNKNOWN_ERROR'))
    render(<UserFormModal {...baseProps} user={existingUser} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('button.accept'))
    await waitFor(() =>
      expect(screen.getByText('users.errors.UNKNOWN_ERROR')).toBeInTheDocument()
    )
  })

  it('shows USERNAME_TAKEN as a username field error, not a generic server error', async () => {
    const onSubmit = jest.fn().mockRejectedValueOnce(new Error('USERNAME_TAKEN'))
    render(<UserFormModal {...baseProps} user={existingUser} onSubmit={onSubmit} />)
    fireEvent.click(screen.getByText('button.accept'))
    await waitFor(() =>
      expect(screen.getByText('users.errors.USERNAME_TAKEN')).toBeInTheDocument()
    )
    // Error must be associated with the username field (rendered via Input's error slot)
    const usernameInput = screen.getByLabelText('users.form.username')
    expect(usernameInput).toHaveAttribute('class', expect.stringContaining('border-destructive'))
  })

  it('calls onClose when cancel is clicked', () => {
    render(<UserFormModal {...baseProps} />)
    fireEvent.click(screen.getByText('button.cancel'))
    expect(baseProps.onClose).toHaveBeenCalled()
  })

  describe('password visibility toggle', () => {
    it('password field is hidden by default', () => {
      render(<UserFormModal {...baseProps} />)
      expect(screen.getByLabelText('users.form.password')).toHaveAttribute('type', 'password')
    })

    it('toggles to text when eye button is clicked', () => {
      render(<UserFormModal {...baseProps} />)
      fireEvent.click(screen.getByLabelText('users.form.showPassword'))
      expect(screen.getByLabelText('users.form.password')).toHaveAttribute('type', 'text')
    })

    it('toggles back to password on second click', () => {
      render(<UserFormModal {...baseProps} />)
      fireEvent.click(screen.getByLabelText('users.form.showPassword'))
      fireEvent.click(screen.getByLabelText('users.form.hidePassword'))
      expect(screen.getByLabelText('users.form.password')).toHaveAttribute('type', 'password')
    })
  })
})
