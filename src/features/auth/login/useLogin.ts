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
}


export function useLogin(): UseLoginReturn {
  const router = useRouter()
  const { t } = useTranslation()

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target
    setErrorMessage(null)
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
    setForm((prev) => ({ ...prev, [name]: e.target.value }))
  }

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
      const { code, ok } = await loginRequest(form)
      if (ok) {
        router.push('/')
        return
      }
      setErrorMessage(t(`auth.errors.${code}`))
    } catch {
      setErrorMessage(t('auth.errors.LOGIN_FAILED'))
    }

    setLoading(false)
  }

  return { form, loading, errorMessage, fieldErrors, handleChange, handleSubmit }
}
