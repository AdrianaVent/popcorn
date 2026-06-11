import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import ProfileModal from './ProfileModal'
import { DEFAULT_AVATAR } from '@/config/avatars'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, string>) =>
    opts ? `${key}:${JSON.stringify(opts)}` : key
  }),
}))

jest.mock('@/components/ui/Modal', () =>
  function MockModal({ title, children }: { title: string; children: React.ReactNode }) {
    return <div role="dialog" aria-label={title}>{children}</div>
  }
)

jest.mock('@/components/ui/AvatarDisplay', () =>
  function MockAvatar({ seed }: { seed: string }) {
    return <div data-testid={`avatar-${seed}`} />
  }
)

jest.mock('@/components/ui/ColorSwatchGrid', () =>
  function MockColorSwatchGrid({ colors, selected, onSelect }: {
    colors: { value: string; labelKey: string }[]
    selected: string
    onSelect: (v: string) => void
  }) {
    return (
      <div data-testid="color-swatch-grid">
        {colors.map((c) => (
          <button key={c.value} aria-pressed={selected === c.value} onClick={() => onSelect(c.value)}>
            {c.labelKey}
          </button>
        ))}
      </div>
    )
  }
)

jest.mock('@/components/icons', () => ({
  PencilIcon:   () => <svg data-testid="pencil-icon" />,
  EyeIcon:      () => <svg data-testid="eye-icon" />,
  EyeSlashIcon: () => <svg data-testid="eye-slash-icon" />,
  CheckIcon:    () => <svg data-testid="check-icon" />,
  XIcon:        () => <svg data-testid="x-icon" />,
}))

const mockSetAvatar = jest.fn()

type StoreState = {
  userId: string
  role: 'guest' | 'admin'
  username: string
  avatar: typeof DEFAULT_AVATAR
  setAvatar: typeof mockSetAvatar
}

let mockRole: 'guest' | 'admin' = 'guest'

jest.mock('@/store/userStore', () => ({
  useUserStore: (sel: (s: StoreState) => unknown) =>
    sel({ userId: 'u1', role: mockRole, username: 'adriana', avatar: DEFAULT_AVATAR, setAvatar: mockSetAvatar }),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: { 'color-contrast': { enabled: false } },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRole = 'guest'
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) })
})

describe('ProfileModal — axe', () => {
  it('has no axe violations (collapsed)', async () => {
    const { container } = render(<ProfileModal onClose={jest.fn()} />)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('has no axe violations (avatar editing expanded)', async () => {
    const { container } = render(<ProfileModal onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'profile.avatar.edit' }))
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('ProfileModal — avatar section', () => {
  it('renders avatar preview', () => {
    render(<ProfileModal onClose={jest.fn()} />)
    expect(screen.getByTestId('avatar-u1')).toBeInTheDocument()
  })

  it('pencil button starts with aria-pressed=false and aria-expanded=false', () => {
    render(<ProfileModal onClose={jest.fn()} />)
    const btn = screen.getByRole('button', { name: 'profile.avatar.edit' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('clicking pencil shows customization options', () => {
    render(<ProfileModal onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'profile.avatar.edit' }))
    expect(screen.getByRole('button', { name: 'profile.avatar.edit' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'profile.avatar.save' })).toBeInTheDocument()
  })

  it('color groups have role="group" with aria-label', () => {
    render(<ProfileModal onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'profile.avatar.edit' }))
    expect(screen.getByRole('group', { name: 'profile.avatar.skin.label' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'profile.avatar.hairColor.label' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'profile.avatar.shirt.label' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'profile.avatar.hair.label' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'profile.avatar.glasses.label' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'profile.avatar.mouth.label' })).toBeInTheDocument()
  })

  it('closing pencil hides customization options', () => {
    render(<ProfileModal onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'profile.avatar.edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'profile.avatar.edit' }))
    expect(screen.queryByRole('button', { name: 'profile.avatar.save' })).not.toBeInTheDocument()
  })

  it('saves avatar and closes editing on success', async () => {
    render(<ProfileModal onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'profile.avatar.edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'profile.avatar.save' }))
    await waitFor(() => {
      expect(mockSetAvatar).toHaveBeenCalledWith(DEFAULT_AVATAR)
      expect(screen.queryByRole('button', { name: 'profile.avatar.save' })).not.toBeInTheDocument()
    })
  })

  it('shows error alert on failed avatar save', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) })
    render(<ProfileModal onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'profile.avatar.edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'profile.avatar.save' }))
    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('profile.avatar.error')
    })
  })

  it('does not render avatar section for admin', () => {
    mockRole = 'admin'
    render(<ProfileModal onClose={jest.fn()} />)
    expect(screen.queryByRole('button', { name: 'profile.avatar.edit' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('avatar-u1')).not.toBeInTheDocument()
  })
})

describe('ProfileModal — password section', () => {
  it('renders section with accessible label', () => {
    render(<ProfileModal onClose={jest.fn()} />)
    expect(screen.getByRole('region', { name: 'profile.password.title' })).toBeInTheDocument()
  })

  it('password inputs start as type=password', () => {
    render(<ProfileModal onClose={jest.fn()} />)
    expect(screen.getByLabelText('profile.password.current')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('profile.password.new')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('profile.password.confirm')).toHaveAttribute('type', 'password')
  })

  it('eye button toggles password visibility for each field', () => {
    render(<ProfileModal onClose={jest.fn()} />)
    const toggles = screen.getAllByLabelText('users.form.showPassword')
    fireEvent.click(toggles[0])
    expect(screen.getByLabelText('profile.password.current')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('profile.password.new')).toHaveAttribute('type', 'password')
  })

  it('shows validation errors when submitting empty form', async () => {
    render(<ProfileModal onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'profile.password.save' }))
    await waitFor(() => {
      expect(screen.getByText('profile.password.currentRequired')).toBeInTheDocument()
      expect(screen.getByText('profile.password.newRequired')).toBeInTheDocument()
    })
  })

  it('shows wrongCurrent error inline on WRONG_PASSWORD response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ code: 'WRONG_PASSWORD' }) })
    render(<ProfileModal onClose={jest.fn()} />)
    fireEvent.change(screen.getByLabelText('profile.password.current'), { target: { value: 'OldPass1!' } })
    fireEvent.change(screen.getByLabelText('profile.password.new'),     { target: { value: 'NewPass1!' } })
    fireEvent.change(screen.getByLabelText('profile.password.confirm'), { target: { value: 'NewPass1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'profile.password.save' }))
    await waitFor(() => {
      expect(screen.getByText('profile.password.wrongCurrent')).toBeInTheDocument()
    })
  })

  it('shows success banner with role=alert on successful password change', async () => {
    render(<ProfileModal onClose={jest.fn()} />)
    fireEvent.change(screen.getByLabelText('profile.password.current'), { target: { value: 'OldPass1!' } })
    fireEvent.change(screen.getByLabelText('profile.password.new'),     { target: { value: 'NewPass1!' } })
    fireEvent.change(screen.getByLabelText('profile.password.confirm'), { target: { value: 'NewPass1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'profile.password.save' }))
    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('profile.password.changed')
      expect(screen.getByTestId('check-icon')).toBeInTheDocument()
    })
  })

  it('shows error banner with role=alert on failed password change', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({ code: 'SERVER_ERROR' }) })
    render(<ProfileModal onClose={jest.fn()} />)
    fireEvent.change(screen.getByLabelText('profile.password.current'), { target: { value: 'OldPass1!' } })
    fireEvent.change(screen.getByLabelText('profile.password.new'),     { target: { value: 'NewPass1!' } })
    fireEvent.change(screen.getByLabelText('profile.password.confirm'), { target: { value: 'NewPass1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'profile.password.save' }))
    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert).toHaveTextContent('profile.password.error')
      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
    })
  })

  it('clears fields after successful password change', async () => {
    render(<ProfileModal onClose={jest.fn()} />)
    const currentInput = screen.getByLabelText('profile.password.current')
    fireEvent.change(currentInput,                                          { target: { value: 'OldPass1!' } })
    fireEvent.change(screen.getByLabelText('profile.password.new'),        { target: { value: 'NewPass1!' } })
    fireEvent.change(screen.getByLabelText('profile.password.confirm'),    { target: { value: 'NewPass1!' } })
    fireEvent.click(screen.getByRole('button', { name: 'profile.password.save' }))
    await waitFor(() => expect(currentInput).toHaveValue(''))
  })

  it('new password input references hint via aria-describedby', () => {
    render(<ProfileModal onClose={jest.fn()} />)
    const input = screen.getByLabelText('profile.password.new')
    expect(input).toHaveAttribute('aria-describedby', 'pw-hint')
    expect(document.getElementById('pw-hint')).toHaveTextContent('profile.password.hint')
  })
})
