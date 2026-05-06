import { renderHook, act } from '@testing-library/react'
import { useLogin } from './useLogin'
import { loginRequest } from './login.service'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: (selector: (s: object) => unknown) =>
    selector({ setUser: jest.fn(), userId: null, role: null, clearUser: jest.fn() }),
}))

jest.mock('./login.service')
const mockLoginRequest = loginRequest as jest.Mock

const submitWith = async (email: string, password: string) => {
  const { result } = renderHook(() => useLogin())

  act(() => {
    result.current.handleChange({ target: { name: 'email', value: email } } as React.ChangeEvent<HTMLInputElement>)
    result.current.handleChange({ target: { name: 'password', value: password } } as React.ChangeEvent<HTMLInputElement>)
  })

  await act(async () => {
    await result.current.handleSubmit({ preventDefault: jest.fn() } as unknown as React.FormEvent)
  })

  return result.current
}

describe('useLogin — validation', () => {
  it('requires username', async () => {
    const { fieldErrors } = await submitWith('', 'Admin123!')
    expect(fieldErrors.email).toBe('login.validation.emailRequired')
  })

  it('requires password', async () => {
    const { fieldErrors } = await submitWith('admin', '')
    expect(fieldErrors.password).toBe('login.validation.passwordRequired')
  })

  it('rejects a password without uppercase', async () => {
    const { fieldErrors } = await submitWith('admin', 'password1!')
    expect(fieldErrors.password).toBe('login.validation.passwordInvalid')
  })

  it('rejects a password without lowercase', async () => {
    const { fieldErrors } = await submitWith('admin', 'PASSWORD1!')
    expect(fieldErrors.password).toBe('login.validation.passwordInvalid')
  })

  it('rejects a password without a number', async () => {
    const { fieldErrors } = await submitWith('admin', 'Password!')
    expect(fieldErrors.password).toBe('login.validation.passwordInvalid')
  })

  it('rejects a password without a special character', async () => {
    const { fieldErrors } = await submitWith('admin', 'Password1')
    expect(fieldErrors.password).toBe('login.validation.passwordInvalid')
  })

  it('rejects a password shorter than 8 characters', async () => {
    const { fieldErrors } = await submitWith('admin', 'Ad1!')
    expect(fieldErrors.password).toBe('login.validation.passwordInvalid')
  })

  it('accepts a valid password and calls loginRequest', async () => {
    mockLoginRequest.mockResolvedValueOnce({ ok: false, code: 'INVALID_CREDENTIALS' })
    const { fieldErrors } = await submitWith('admin', 'Admin123!')
    expect(fieldErrors.password).toBeUndefined()
    expect(mockLoginRequest).toHaveBeenCalled()
  })
})

describe('useLogin — server response', () => {
  it('shows error message on invalid credentials', async () => {
    mockLoginRequest.mockResolvedValueOnce({ ok: false, code: 'INVALID_CREDENTIALS' })
    const { errorMessage } = await submitWith('admin', 'Admin123!')
    expect(errorMessage).toBe('auth.errors.INVALID_CREDENTIALS')
  })

  it('shows generic error on unexpected failure', async () => {
    mockLoginRequest.mockRejectedValueOnce(new Error('Network error'))
    const { errorMessage } = await submitWith('admin', 'Admin123!')
    expect(errorMessage).toBe('auth.errors.LOGIN_FAILED')
  })
})
