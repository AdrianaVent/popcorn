import { render, screen, fireEvent } from '@testing-library/react'
import ToastItem from './ToastItem'
import type { Toast } from '@/store/toastStore'

const make = (type: Toast['type']): Toast => ({ id: 'toast-1', type, message: `${type} message` })

describe('rendering', () => {
  it('renders the message', () => {
    render(<ToastItem toast={make('success')} onDismiss={jest.fn()} />)
    expect(screen.getByText('success message')).toBeInTheDocument()
  })

  it.each([
    ['success', 'bg-green-100'],
    ['error',   'bg-red-100'],
    ['warning', 'bg-yellow-100'],
    ['info',    'bg-blue-100'],
  ] as const)('%s type applies correct background class', (type, bgClass) => {
    render(<ToastItem toast={make(type)} onDismiss={jest.fn()} />)
    expect(screen.getByRole('alert')).toHaveClass(bgClass)
  })

  it.each([
    ['success', 'border-l-green-500'],
    ['error',   'border-l-red-500'],
    ['warning', 'border-l-yellow-500'],
    ['info',    'border-l-blue-500'],
  ] as const)('%s type applies correct left border color', (type, borderClass) => {
    render(<ToastItem toast={make(type)} onDismiss={jest.fn()} />)
    expect(screen.getByRole('alert')).toHaveClass(borderClass)
  })
})

describe('dismiss', () => {
  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn()
    render(<ToastItem toast={make('success')} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
