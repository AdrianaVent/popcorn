import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import IconToggleButton from './IconToggleButton'

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: { 'color-contrast': { enabled: false } },
}

type ExtraProps = Omit<React.ComponentProps<typeof IconToggleButton>, 'active' | 'children'>

function renderButton(active: boolean, extra: ExtraProps = {}) {
  return render(
    <IconToggleButton active={active} aria-label="Toggle action" {...extra}>
      <span>icon</span>
    </IconToggleButton>,
  )
}

describe('IconToggleButton — axe accessibility', () => {
  it('passes axe when inactive', async () => {
    const { container } = renderButton(false)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when active', async () => {
    const { container } = renderButton(true)
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe when disabled', async () => {
    const { container } = renderButton(false, { disabled: true })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

describe('IconToggleButton — ARIA', () => {
  it('has aria-pressed=false when inactive', () => {
    renderButton(false)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('has aria-pressed=true when active', () => {
    renderButton(true)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('updates aria-pressed on rerender', () => {
    const { rerender } = renderButton(false)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
    rerender(
      <IconToggleButton active={true} aria-label="Toggle action">
        <span>icon</span>
      </IconToggleButton>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('uses the provided aria-label as accessible name', () => {
    renderButton(false, { 'aria-label': 'Show trailer' })
    expect(screen.getByRole('button', { name: 'Show trailer' })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    renderButton(false, { onClick })
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', () => {
    const onClick = jest.fn()
    renderButton(false, { disabled: true, onClick })
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
