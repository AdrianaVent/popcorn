import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToggleSwitch from './ToggleSwitch'

type Mode = 'user' | 'global'

const options: [{ value: Mode; label: string }, { value: Mode; label: string }] = [
  { value: 'user',   label: 'My profile' },
  { value: 'global', label: 'Global'     },
]

describe('ToggleSwitch', () => {
  it('renders both option labels', () => {
    render(<ToggleSwitch options={options} value="user" onChange={() => {}} />)
    expect(screen.getByText('My profile')).toBeInTheDocument()
    expect(screen.getByText('Global')).toBeInTheDocument()
  })

  it('applies the active style to the selected option', () => {
    render(<ToggleSwitch options={options} value="user" onChange={() => {}} />)
    const activeBtn = screen.getByText('My profile').closest('button')!
    expect(activeBtn.className).toMatch(/bg-primary/)
  })

  it('does not apply the active style to the inactive option', () => {
    render(<ToggleSwitch options={options} value="user" onChange={() => {}} />)
    const inactiveBtn = screen.getByText('Global').closest('button')!
    expect(inactiveBtn.className).not.toMatch(/bg-primary\b/)
  })

  it('calls onChange with the correct value when an option is clicked', async () => {
    const onChange = jest.fn()
    render(<ToggleSwitch options={options} value="user" onChange={onChange} />)
    await userEvent.click(screen.getByText('Global'))
    expect(onChange).toHaveBeenCalledWith('global')
  })

  it('calls onChange when the active option is clicked again', async () => {
    const onChange = jest.fn()
    render(<ToggleSwitch options={options} value="user" onChange={onChange} />)
    await userEvent.click(screen.getByText('My profile'))
    expect(onChange).toHaveBeenCalledWith('user')
  })

  it('renders with role="group"', () => {
    render(<ToggleSwitch options={options} value="global" onChange={() => {}} />)
    expect(screen.getByRole('group')).toBeInTheDocument()
  })

  it('reflects a different active option when value changes', () => {
    const { rerender } = render(<ToggleSwitch options={options} value="user" onChange={() => {}} />)
    rerender(<ToggleSwitch options={options} value="global" onChange={() => {}} />)
    const globalBtn = screen.getByText('Global').closest('button')!
    expect(globalBtn.className).toMatch(/bg-primary/)
  })
})
