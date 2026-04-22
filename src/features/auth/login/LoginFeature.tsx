'use client'

import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { useLogin } from './useLogin'
import LoginForm from './LoginForm'

export default function LoginFeature() {
  const { t } = useTranslation()
  const {
    form,
    loading,
    errorMessage,
    fieldErrors,
    handleChange,
    handleSubmit,
    handleResetSubmit,
    handleResetError,
  } = useLogin()

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <Image src="/icons/popcorn.svg" alt="Popcorn" width={340} height={136} loading="eager" />

        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 h-px bg-yellow-500 opacity-60" />
          <p className="text-[0.7rem] tracking-[0.15em] text-muted-foreground whitespace-nowrap">
            ✦ POP. WATCH. REPEAT. ✦
          </p>
          <div className="flex-1 h-px bg-yellow-500 opacity-60" />
        </div>
      </div>

      <p className="text-[0.8rem] text-muted-foreground text-center tracking-wide">
        {t('login.subtitle')}
      </p>

      <LoginForm
        form={form}
        loading={loading}
        errorMessage={errorMessage}
        fieldErrors={fieldErrors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onResetSubmit={handleResetSubmit}
        onResetError={handleResetError}
      />
    </>
  )
}
