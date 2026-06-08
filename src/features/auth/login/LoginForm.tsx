'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'
import EyeSlashIcon from '@/components/icons/EyeSlashIcon'
import EyeIcon from '@/components/icons/EyeIcon'
import ResetPasswordForm from './ResetPasswordForm'

type LoginFormProps = {
  form: { email: string; password: string }
  loading: boolean
  errorMessage: string | null
  fieldErrors: { email?: string; password?: string }
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onResetSubmit: (e: React.FormEvent) => Promise<void>
  onResetError?: () => void
}

type Mode = 'login' | 'forgot'

export default function LoginForm({
  form,
  loading,
  errorMessage,
  fieldErrors,
  onChange,
  onSubmit,
  onResetError,
  onResetSubmit,
}: LoginFormProps) {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState<Mode>('login')
  const [successMessage, setSuccessMessage] = useState<boolean>(false)

  /* ─── FORGOT PASSWORD ───────────────────── */
  if (mode === 'forgot') {
    return (
      <ResetPasswordForm
        email={form.email}
        onChange={onChange}
        onSubmit={async (e) => {
          await onResetSubmit(e)
          setSuccessMessage(true)
          setMode('login')
        }}
        onBack={() => {
          setMode('login')
          onResetError?.()
        }}
        fieldErrors={fieldErrors}
      />
    )
  }

  /* ─── LOGIN ─────────────────────────────── */
  return (
    <form
      onSubmit={async (e) => {
        await onSubmit(e)
        setSuccessMessage(false)}}
        noValidate
        className="flex flex-col gap-4"
      >
      {successMessage && (
        <div role="alert" className="mb-2 rounded-md bg-green-500/10 hc:bg-transparent hc:border hc:border-green-500 px-3 py-2 text-center">
          <p className="text-caption text-green-700 dark:text-green-400 font-medium">
            {t('auth.reset.messageSuccess')}
          </p>
        </div>
      )}

      {errorMessage && (
        <div role="alert" data-cy="login-error" className="rounded-md bg-destructive/10 hc:bg-transparent hc:border hc:border-destructive px-3 py-1.5">
          <Text variant="caption" className="text-red-700 dark:text-red-400 font-medium leading-tight">
            {errorMessage}
          </Text>
        </div>
      )}

      <Input
        id="email"
        name="email"
        type="text"
        label={t('login.email')}
        value={form.email}
        onChange={onChange}
        autoComplete="username"
        error={fieldErrors.email}
      />

      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        label={t('login.password')}
        value={form.password}
        onChange={onChange}
        autoComplete="current-password"
        error={fieldErrors.password}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
            className="flex items-center bg-transparent border-0 cursor-pointer p-0 text-muted-foreground"
          >
            <span aria-hidden="true">{showPassword ? <EyeIcon size={16} /> : <EyeSlashIcon size={16} />}</span>
          </button>
        }
      />

      <button
        type="button"
        onClick={() => {
          setMode('forgot')
          setSuccessMessage(false)
        }}
        className="text-caption text-muted-foreground hover:text-foreground hover:underline self-end -mt-2 cursor-pointer"
      >
        {t('login.forgotPassword')}
      </button>

      <Button type="submit" loading={loading}>
        {loading ? t('login.loading') : t('login.submit')}
      </Button>
    </form>
  )
}