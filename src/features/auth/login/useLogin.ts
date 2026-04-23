'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { loginRequest } from './login.service'

type LoginForm = {
  email: string
  password: string
}

type FieldErrors = {
  email?: string
  password?: string
}

type UseLoginReturn = {
  form: LoginForm
  loading: boolean
  errorMessage: string | null
  fieldErrors: FieldErrors
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  handleResetSubmit: (e: React.FormEvent) => Promise<void>
  handleResetError: () => void
}

export function useLogin(): UseLoginReturn {
  const router = useRouter()
  const { t } = useTranslation()

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  /* ─── VALIDATION ─────────────────────────────── */
  const validate = (data: LoginForm): FieldErrors => {
    const errors: FieldErrors = {}

    if (!data.email) {
      errors.email = t('login.validation.emailRequired')
    }

    if (!data.password) {
      errors.password = t('login.validation.passwordRequired')
    }

    return errors
  }

  /* ─── CHANGE ─────────────────────────────────── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setErrorMessage(null)
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  /* ─── LOGIN ──────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validate(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const { ok, code } = await loginRequest(form)

      if (ok) {
        router.push('/movies')
        return
      }

      setErrorMessage(t(`auth.errors.${code}`))
    } catch {
      setErrorMessage(t('auth.errors.LOGIN_FAILED'))
    }

    setLoading(false)
  }

  /* ─── RESET PASSWORD (MOCK) ─────────────────── */
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setErrorMessage(null)

    await new Promise((res) => setTimeout(res, 800))

    setLoading(false)
  }

  /* ─── RESET ERRORS ───────────────────────────── */
  const handleResetError = () => {
    setErrorMessage(null)
    setFieldErrors({})
  }

  return {
    form,
    loading,
    errorMessage,
    fieldErrors,
    handleChange,
    handleSubmit,
    handleResetSubmit,
    handleResetError,
  }
}