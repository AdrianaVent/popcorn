'use client'

import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'
import { EyeIcon, EyeSlashIcon } from '@/components/icons'

type Field = 'current' | 'next' | 'confirm'

type Props = {
  values: Record<Field, string>
  errors: Partial<Record<Field, string>>
  show: Record<Field, boolean>
  onChange: (field: Field, value: string) => void
  onToggleShow: (field: Field) => void
}

export default function PasswordFields({ values, errors, show, onChange, onToggleShow }: Props) {
  const { t } = useTranslation()

  const eyeBtn = (field: Field) => (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => onToggleShow(field)}
      aria-label={show[field] ? t('users.form.hidePassword') : t('users.form.showPassword')}
      className="text-muted-foreground hc:text-foreground hover:text-foreground transition-colors"
    >
      <span aria-hidden="true">
        {show[field] ? <EyeSlashIcon size={15} /> : <EyeIcon size={15} />}
      </span>
    </button>
  )

  return (
    <>
      <Input
        id="pw-current"
        type={show.current ? 'text' : 'password'}
        label={t('profile.password.current')}
        autoComplete="current-password"
        value={values.current}
        onChange={(e) => onChange('current', e.target.value)}
        error={errors.current}
        rightElement={eyeBtn('current')}
      />
      <Input
        id="pw-new"
        type={show.next ? 'text' : 'password'}
        label={t('profile.password.new')}
        autoComplete="new-password"
        value={values.next}
        onChange={(e) => onChange('next', e.target.value)}
        error={errors.next}
        rightElement={eyeBtn('next')}
        aria-describedby="pw-hint"
      />
      <Input
        id="pw-confirm"
        type={show.confirm ? 'text' : 'password'}
        label={t('profile.password.confirm')}
        autoComplete="new-password"
        value={values.confirm}
        onChange={(e) => onChange('confirm', e.target.value)}
        error={errors.confirm}
        rightElement={eyeBtn('confirm')}
      />
    </>
  )
}
