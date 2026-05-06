import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

let shouldThrow = false

function MaybeThrow() {
  if (shouldThrow) throw new Error('render error')
  return <div>child content</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = false
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('child content')).toBeInTheDocument()
    expect(screen.queryByText('common.errorBoundary')).not.toBeInTheDocument()
  })

  it('renders the fallback when a child throws', () => {
    shouldThrow = true
    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('common.errorBoundary')).toBeInTheDocument()
    expect(screen.getByText('common.retry')).toBeInTheDocument()
    expect(screen.queryByText('child content')).not.toBeInTheDocument()
  })

  it('recovers and shows children again after clicking retry', () => {
    shouldThrow = true
    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    )
    expect(screen.getByText('common.errorBoundary')).toBeInTheDocument()

    shouldThrow = false
    fireEvent.click(screen.getByText('common.retry'))

    expect(screen.getByText('child content')).toBeInTheDocument()
    expect(screen.queryByText('common.errorBoundary')).not.toBeInTheDocument()
  })

  it('shows the fallback again if the child still throws after retry', () => {
    shouldThrow = true
    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>
    )
    fireEvent.click(screen.getByText('common.retry'))
    expect(screen.getByText('common.errorBoundary')).toBeInTheDocument()
  })
})
