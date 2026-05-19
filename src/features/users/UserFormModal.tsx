'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '@/components/ui/Modal'
import ModalFooter from '@/components/ui/ModalFooter'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { CheckIcon, XIcon, EyeIcon, EyeSlashIcon } from '@/components/icons'
import type { PublicUser } from '@/types/user'
import type { UserRole } from '@/db/users'

type Props = {
  user?: PublicUser
  isSelf: boolean
  onClose: () => void
  onSubmit: (data: { username: string; password: string; role: UserRole }) => Promise<void>
}

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

export default function UserFormModal({ user, isSelf, onClose, onSubmit }: Props) {
  const { t } = useTranslation()
  const isEdit = Boolean(user)

  const [username, setUsername] = useState(user?.username ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<UserRole>(user?.role ?? 'guest')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!username.trim()) e.username = t('login.validation.emailRequired')
    if (!isEdit && !password) e.password = t('login.validation.passwordRequired')
    if (password && !PASSWORD_REGEX.test(password)) e.password = t('login.validation.passwordInvalid')
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setServerError(null)
    try {
      await onSubmit({ username: username.trim(), password, role })
      onClose()
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
      if (code === 'USERNAME_TAKEN') {
        setErrors((p) => ({ ...p, username: t('users.errors.USERNAME_TAKEN') }))
      } else {
        setServerError(t(`users.errors.${code}`, { defaultValue: t('users.errors.UNKNOWN_ERROR') }))
      }
    } finally {
      setLoading(false)
    }
  }

  const title = isEdit ? t('users.form.edit') : t('users.form.add')

  const eyeToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className="text-muted-foreground hover:text-foreground transition-colors"
      tabIndex={-1}
      aria-label={showPassword ? t('users.form.hidePassword') : t('users.form.showPassword')}
    >
      {showPassword ? <EyeSlashIcon size={15} /> : <EyeIcon size={15} />}
    </button>
  )

  return (
    <Modal
      title={title}
      onClose={onClose}
      maxWidth="28rem"
      dismissOnOverlayClick={false}
      footer={
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            icon={<XIcon size={14} />}
            hideIconBelow="sm"
            onClick={onClose}
            className="w-auto px-4"
          >
            {t('button.cancel')}
          </Button>
          <Button
            type="submit"
            form="user-form"
            icon={<CheckIcon size={14} />}
            hideIconBelow="sm"
            loading={loading}
            className="w-auto px-4"
          >
            {t('button.accept')}
          </Button>
        </ModalFooter>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="username"
          label={t('users.form.username')}
          value={username}
          onChange={(e) => { setUsername(e.target.value); setErrors((p) => ({ ...p, username: '' })) }}
          error={errors.username}
          autoComplete="off"
        />

        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          label={t('users.form.password')}
          placeholder={isEdit ? t('users.form.passwordHint') : undefined}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })) }}
          error={errors.password}
          autoComplete="new-password"
          rightElement={eyeToggle}
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="text-caption font-normal text-muted-foreground">
            {t('users.form.role')}
          </label>
          <select
            id="role"
            value={role}
            disabled={isSelf}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3 py-2.5 rounded-md border border-border text-small text-foreground bg-card outline-none transition-colors disabled:opacity-50"
          >
            <option value="guest">{t('users.roles.guest')}</option>
            <option value="admin">{t('users.roles.admin')}</option>
          </select>
        </div>

        {serverError && (
          <p className="text-[0.7rem] text-destructive">{serverError}</p>
        )}
      </form>
    </Modal>
  )
}
