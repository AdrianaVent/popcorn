'use client'

import type { Toast, ToastType } from '@/store/toastStore'
import { CheckIcon, XIcon, WarningIcon, InfoIcon } from '@/components/icons'

const config: Record<ToastType, {
  container: string
  iconBg: string
  Icon: React.ComponentType<{ size?: number }>
}> = {
  success: {
    container: 'bg-green-100 dark:bg-card border-green-200 dark:border-green-600/60 border-l-green-500 dark:border-l-green-400 text-green-700 dark:text-green-300',
    iconBg: 'bg-green-500/20 dark:bg-green-400/15',
    Icon: CheckIcon,
  },
  error: {
    container: 'bg-red-100 dark:bg-card border-red-200 dark:border-red-600/60 border-l-red-500 dark:border-l-red-400 text-red-700 dark:text-red-300',
    iconBg: 'bg-red-500/20 dark:bg-red-400/15',
    Icon: XIcon,
  },
  warning: {
    container: 'bg-yellow-100 dark:bg-card border-yellow-200 dark:border-yellow-600/60 border-l-yellow-500 dark:border-l-yellow-400 text-yellow-700 dark:text-yellow-300',
    iconBg: 'bg-yellow-500/20 dark:bg-yellow-400/15',
    Icon: WarningIcon,
  },
  info: {
    container: 'bg-blue-100 dark:bg-card border-blue-200 dark:border-blue-600/60 border-l-blue-500 dark:border-l-blue-400 text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-500/20 dark:bg-blue-400/15',
    Icon: InfoIcon,
  },
}

type Props = {
  toast: Toast
  onDismiss: () => void
}

export default function ToastItem({ toast, onDismiss }: Props) {
  const { container, iconBg, Icon } = config[toast.type]

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-md border border-l-4 text-sm font-medium max-w-sm w-full ${container}`}
    >
      <span className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-full ${iconBg}`}>
        <Icon size={14} />
      </span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity leading-none"
        aria-label="Dismiss"
      >
        <XIcon size={14} />
      </button>
    </div>
  )
}
