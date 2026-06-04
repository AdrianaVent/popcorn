import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import WatchedToggleButton from './WatchedToggleButton'

jest.mock('@/components/icons', () => ({
  EyeIcon: () => <svg data-testid="eye-icon" />,
}))

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: { 'color-contrast': { enabled: false } },
}

function renderButton(isWatched: boolean, extra: Partial<React.ComponentProps<typeof WatchedToggleButton>> = {}) {
  return render(
    <WatchedToggleButton
      isWatched={isWatched}
      label={isWatched ? 'Watched' : 'Mark as watched'}
      onClick={jest.fn()}
      {...extra}
    />,
  )
}

describe('WatchedToggleButton — axe accessibility', () => {
  it('passes axe when not watched', async () => {
    const { container } = renderButton(false)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when watched', async () => {
    const { container } = renderButton(true)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when loading', async () => {
    const { container } = renderButton(false, { loading: true })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('WatchedToggleButton — ARIA', () => {
  it('has aria-pressed=false when not watched', () => {
    renderButton(false)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('has aria-pressed=true when watched', () => {
    renderButton(true)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('updates aria-pressed on rerender', () => {
    const { rerender } = renderButton(false)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
    rerender(<WatchedToggleButton isWatched={true} label="Watched" onClick={jest.fn()} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('is disabled when loading=true', () => {
    renderButton(false, { loading: true })
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is not disabled when not loading', () => {
    renderButton(false)
    expect(screen.getByRole('button')).not.toBeDisabled()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    renderButton(false, { onClick })
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders the label text', () => {
    renderButton(false, { label: 'Mark as watched' })
    expect(screen.getByText('Mark as watched')).toBeInTheDocument()
  })

  it('renders the eye icon', () => {
    renderButton(false)
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument()
  })
})
