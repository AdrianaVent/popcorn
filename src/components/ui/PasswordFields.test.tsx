'use client'

import { render, screen, fireEvent } from '@testing-library/react'
import PasswordFields from './PasswordFields'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/components/icons', () => ({
  EyeIcon: () => <span>eye</span>,
  EyeSlashIcon: () => <span>eye-slash</span>,
}))

const DEFAULT_VALUES = { current: '', next: '', confirm: '' }
const DEFAULT_SHOW   = { current: false, next: false, confirm: false }
const DEFAULT_ERRORS = {}

function renderFields(overrides: Partial<React.ComponentProps<typeof PasswordFields>> = {}) {
  const onChange      = jest.fn()
  const onToggleShow  = jest.fn()
  render(
    <PasswordFields
      values={DEFAULT_VALUES}
      errors={DEFAULT_ERRORS}
      show={DEFAULT_SHOW}
      onChange={onChange}
      onToggleShow={onToggleShow}
      {...overrides}
    />
  )
  return { onChange, onToggleShow }
}

describe('PasswordFields', () => {
  it('renders all three inputs', () => {
    renderFields()
    expect(screen.getByLabelText('profile.password.current')).toBeInTheDocument()
    expect(screen.getByLabelText('profile.password.new')).toBeInTheDocument()
    expect(screen.getByLabelText('profile.password.confirm')).toBeInTheDocument()
  })

  it('all inputs are type=password by default', () => {
    renderFields()
    expect(screen.getByLabelText('profile.password.current')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('profile.password.new')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('profile.password.confirm')).toHaveAttribute('type', 'password')
  })

  it('shows text type when show.current is true', () => {
    renderFields({ show: { current: true, next: false, confirm: false } })
    expect(screen.getByLabelText('profile.password.current')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('profile.password.new')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('profile.password.confirm')).toHaveAttribute('type', 'password')
  })

  it('calls onChange with field and value when typing', () => {
    const { onChange } = renderFields()
    fireEvent.change(screen.getByLabelText('profile.password.current'), { target: { value: 'abc' } })
    expect(onChange).toHaveBeenCalledWith('current', 'abc')
    fireEvent.change(screen.getByLabelText('profile.password.new'), { target: { value: 'xyz' } })
    expect(onChange).toHaveBeenCalledWith('next', 'xyz')
    fireEvent.change(screen.getByLabelText('profile.password.confirm'), { target: { value: '123' } })
    expect(onChange).toHaveBeenCalledWith('confirm', '123')
  })

  it('calls onToggleShow with the correct field when eye button is clicked', () => {
    const { onToggleShow } = renderFields()
    const [btnCurrent, btnNext, btnConfirm] = screen.getAllByLabelText('users.form.showPassword')
    fireEvent.click(btnCurrent)
    expect(onToggleShow).toHaveBeenCalledWith('current')
    fireEvent.click(btnNext)
    expect(onToggleShow).toHaveBeenCalledWith('next')
    fireEvent.click(btnConfirm)
    expect(onToggleShow).toHaveBeenCalledWith('confirm')
  })

  it('eye button aria-label changes to hidePassword when field is visible', () => {
    renderFields({ show: { current: true, next: false, confirm: false } })
    expect(screen.getByLabelText('users.form.hidePassword')).toBeInTheDocument()
    expect(screen.getAllByLabelText('users.form.showPassword')).toHaveLength(2)
  })

  it('shows error messages under each field', () => {
    renderFields({
      errors: { current: 'err-current', next: 'err-next', confirm: 'err-confirm' },
    })
    expect(screen.getByText('err-current')).toBeInTheDocument()
    expect(screen.getByText('err-next')).toBeInTheDocument()
    expect(screen.getByText('err-confirm')).toBeInTheDocument()
  })
})
