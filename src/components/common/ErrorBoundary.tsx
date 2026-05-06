'use client'

import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import Text from '@/components/ui/Text'

function ErrorFallback({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Text variant="body" className="text-muted-foreground">{t('common.errorBoundary')}</Text>
      <Button variant="secondary" onClick={onReset}>{t('common.retry')}</Button>
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
