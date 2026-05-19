'use client'

import { useTranslation } from 'react-i18next'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'

type ResetPasswordFormProps = {
  email: string
  loading?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
  fieldErrors: { email?: string; password?: string }
}

export default function ResetPasswordForm({
  email,
  loading,
  onChange,
  onSubmit,
  onBack,
  fieldErrors
}: ResetPasswordFormProps) {
  const { t } = useTranslation()

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Text variant="subtitle">{t('login.resetPassword')}</Text>

      <Text variant="caption" className="text-muted-foreground">
        {t('login.resetDescription')}
      </Text>

      <div className="rounded-md bg-yellow-500/10 px-3 py-2">
        <Text variant="caption" className="text-yellow-600 dark:text-yellow-400 font-medium">
          {t('login.resetMockNotice')}
        </Text>
      </div>

      <Input
        id="email"
        name="email"
        type="text"
        label={t('login.email')}
        value={email}
        onChange={onChange}
        autoComplete="email"
        error={fieldErrors.email}
      />

      <Button type="submit" loading={loading} onClick={onSubmit}>
        {t('login.resetPassword')}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="text-caption text-muted-foreground hover:text-foreground hover:underline self-start -mt-2 cursor-pointer"
      >
        {t('login.backLogin')}
      </button>
    </form>
  )
}