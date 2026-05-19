'use client'

import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'
import { WarningIcon } from '@/components/icons'

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-4 py-8">
      <WarningIcon size={36} color="var(--color-muted-foreground)" />
      <Text variant="subtitle" className="text-foreground max-w-sm">{t('common.errorBoundary')}</Text>
      <Button variant="secondary" onClick={onReset} className="w-auto! px-4">{t('common.retry')}</Button>
    </div>
  )
}

interface State { hasError: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  reset = () => this.setState({ hasError: false })

  render() {
    if (this.state.hasError) return <ErrorFallback onReset={this.reset} />
    return this.props.children
  }
}
