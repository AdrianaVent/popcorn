'use client'

import dynamic from 'next/dynamic'
import AuthLayout from '@/components/layouts/AuthLayout'
import LoginSkeleton from '@/components/ui/LoginSkeleton'

const LoginFeature = dynamic(() => import('@/features/auth/login'), {
  ssr: false,
  loading: () => <LoginSkeleton />,
})

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginFeature />
    </AuthLayout>
  )
}
