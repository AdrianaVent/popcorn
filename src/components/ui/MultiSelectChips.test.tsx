import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MultiSelectChips from './MultiSelectChips'
import type { FilterOption } from '@/types/table'

jest.mock('@/components/ui/Tooltip', () => {
  function MockTooltip({ children }: { children: React.ReactNode }) { return <>{children}</> }
  return MockTooltip
})

jest.mock('@/components/icons', () => ({
  ChevronDownIcon: () => <svg data-testid="chevron" />,
}))

const options: FilterOption[] = [
  { value: 28, label: 'Action' },
  { value: 18, label: 'Drama' },
  { value: 35, label: 'Comedy' },
]

describe('MultiSelectChips', () => {
  describe('trigger', () => {
    it('shows placeholder when nothing is selected', () => {
      render(<MultiSelectChips options={options} value={[]} onChange={jest.fn()} placeholder="All genres" />)
      expect(screen.getByText('All genres')).toBeInTheDocument()
    })

    it('hides placeholder when options are selected', () => {
      render(<MultiSelectChips options={options} value={[28]} onChange={jest.fn()} placeholder="All genres" />)
      expect(screen.queryByText('All genres')).not.toBeInTheDocument()
    })

    it('renders the chevron icon', () => {
      render(<MultiSelectChips options={options} value={[]} onChange={jest.fn()} />)
      expect(screen.getByTestId('chevron')).toBeInTheDocument()
    })
  })

  describe('dropdown open/close', () => {
    it('opens dropdown on trigger click showing all options', async () => {
      render(<MultiSelectChips options={options} value={[]} onChange={jest.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Drama')).toBeInTheDocument()
      expect(screen.getByText('Comedy')).toBeInTheDocument()
    })

    it('closes dropdown on second trigger click', async () => {
      render(<MultiSelectChips options={options} value={[]} onChange={jest.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Action')).toBeInTheDocument()
      await userEvent.click(screen.getAllByRole('button')[0])
      expect(screen.queryByText('Action')).not.toBeInTheDocument()
    })

    it('closes dropdown when clicking outside', async () => {
      render(
        <div>
          <MultiSelectChips options={options} value={[]} onChange={jest.fn()} />
          <div data-testid="outside">outside</div>
        </div>
      )
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Action')).toBeInTheDocument()
      fireEvent.mouseDown(screen.getByTestId('outside'))
      expect(screen.queryByText('Action')).not.toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('calls onChange adding the option when an unselected option is clicked', async () => {
      const onChange = jest.fn()
      render(<MultiSelectChips options={options} value={[]} onChange={onChange} />)
      await userEvent.click(screen.getByRole('button'))
      await userEvent.click(screen.getByText('Drama'))
      expect(onChange).toHaveBeenCalledWith([18])
    })

    it('preserves existing selections when adding a new option', async () => {
      const onChange = jest.fn()
      render(<MultiSelectChips options={options} value={[28]} onChange={onChange} />)
      await userEvent.click(screen.getAllByRole('button')[0])
      await userEvent.click(screen.getByText('Drama'))
      expect(onChange).toHaveBeenCalledWith([28, 18])
    })

    it('calls onChange removing the option when a selected option is clicked', async () => {
      const onChange = jest.fn()
      render(<MultiSelectChips options={options} value={[28, 18]} onChange={onChange} />)
      await userEvent.click(screen.getAllByRole('button')[0])
      await userEvent.click(screen.getByText('Action'))
      expect(onChange).toHaveBeenCalledWith([18])
    })

    it('can deselect the last selected option', async () => {
      const onChange = jest.fn()
      render(<MultiSelectChips options={options} value={[35]} onChange={onChange} />)
      await userEvent.click(screen.getAllByRole('button')[0])
      await userEvent.click(screen.getByText('Comedy'))
      expect(onChange).toHaveBeenCalledWith([])
    })
  })

  describe('options with icons', () => {
    const ActionIcon = () => <svg data-testid="action-icon" />
    const optionsWithIcons: FilterOption[] = [
      { value: 28, label: 'Action', icon: ActionIcon },
      { value: 18, label: 'Drama' },
    ]

    it('renders option icon in dropdown when provided', async () => {
      render(<MultiSelectChips options={optionsWithIcons} value={[]} onChange={jest.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByTestId('action-icon')).toBeInTheDocument()
    })

    it('shows selected option icon in trigger', () => {
      render(<MultiSelectChips options={optionsWithIcons} value={[28]} onChange={jest.fn()} />)
      expect(screen.getByTestId('action-icon')).toBeInTheDocument()
    })
  })
})
