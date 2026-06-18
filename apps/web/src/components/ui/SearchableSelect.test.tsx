import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchableSelect from './SearchableSelect'

jest.mock('@/components/icons', () => ({
  ChevronDownIcon: () => <svg data-testid="chevron" />,
  XIcon: () => <svg data-testid="x-icon" />,
}))

const options = [
  { value: 1, label: 'Action' },
  { value: 2, label: 'Drama' },
  { value: 3, label: 'Comedy' },
]

describe('SearchableSelect', () => {
  describe('trigger', () => {
    it('shows placeholder when no value is selected', () => {
      render(<SearchableSelect options={options} value={null} onChange={jest.fn()} placeholder="All" />)
      expect(screen.getByText('All')).toBeInTheDocument()
    })

    it('shows selected option label when value matches', () => {
      render(<SearchableSelect options={options} value={2} onChange={jest.fn()} placeholder="All" />)
      expect(screen.getByText('Drama')).toBeInTheDocument()
    })

    it('shows chevron icon when nothing is selected', () => {
      render(<SearchableSelect options={options} value={null} onChange={jest.fn()} />)
      expect(screen.getByTestId('chevron')).toBeInTheDocument()
    })

    it('shows X icon when a value is selected', () => {
      render(<SearchableSelect options={options} value={1} onChange={jest.fn()} />)
      expect(screen.getByTestId('x-icon')).toBeInTheDocument()
    })
  })

  describe('dropdown open/close', () => {
    it('opens dropdown and shows all options', async () => {
      render(<SearchableSelect options={options} value={null} onChange={jest.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Drama')).toBeInTheDocument()
      expect(screen.getByText('Comedy')).toBeInTheDocument()
    })

    it('closes dropdown on second trigger click', async () => {
      render(<SearchableSelect options={options} value={null} onChange={jest.fn()} />)
      const trigger = screen.getByRole('button')
      await userEvent.click(trigger)
      expect(screen.getByText('Action')).toBeInTheDocument()
      await userEvent.click(trigger)
      expect(screen.queryByText('Action')).not.toBeInTheDocument()
    })

    it('closes on outside mousedown', async () => {
      render(
        <div>
          <SearchableSelect options={options} value={null} onChange={jest.fn()} />
          <div data-testid="outside">outside</div>
        </div>
      )
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('Action')).toBeInTheDocument()
      fireEvent.mouseDown(screen.getByTestId('outside'))
      expect(screen.queryByText('Action')).not.toBeInTheDocument()
    })
  })

  describe('search', () => {
    it('filters options by search text', async () => {
      render(<SearchableSelect options={options} value={null} onChange={jest.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      await userEvent.type(screen.getByRole('textbox'), 'dra')
      expect(screen.getByText('Drama')).toBeInTheDocument()
      expect(screen.queryByText('Action')).not.toBeInTheDocument()
      expect(screen.queryByText('Comedy')).not.toBeInTheDocument()
    })

    it('is case-insensitive', async () => {
      render(<SearchableSelect options={options} value={null} onChange={jest.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      await userEvent.type(screen.getByRole('textbox'), 'ACTION')
      expect(screen.getByText('Action')).toBeInTheDocument()
    })

    it('shows empty indicator when search matches nothing', async () => {
      render(<SearchableSelect options={options} value={null} onChange={jest.fn()} placeholder="All" />)
      await userEvent.click(screen.getByRole('button'))
      await userEvent.type(screen.getByRole('textbox'), 'xyz')
      // "—" appears only in the empty-state div (not in the trigger which shows "All")
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('clears search when dropdown closes', async () => {
      render(<SearchableSelect options={options} value={null} onChange={jest.fn()} />)
      const trigger = screen.getByRole('button')
      await userEvent.click(trigger)
      await userEvent.type(screen.getByRole('textbox'), 'dra')
      expect(screen.queryByText('Action')).not.toBeInTheDocument()
      // close then reopen — all options should be visible again
      fireEvent.mouseDown(document.body)
      await userEvent.click(trigger)
      expect(screen.getByText('Action')).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('calls onChange with option value when an option is clicked', async () => {
      const onChange = jest.fn()
      render(<SearchableSelect options={options} value={null} onChange={onChange} />)
      await userEvent.click(screen.getByRole('button'))
      await userEvent.click(screen.getByText('Drama'))
      expect(onChange).toHaveBeenCalledWith(2)
    })

    it('closes dropdown after selection', async () => {
      render(<SearchableSelect options={options} value={null} onChange={jest.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      await userEvent.click(screen.getByText('Action'))
      expect(screen.queryByText('Drama')).not.toBeInTheDocument()
    })

    it('calls onChange with null when X is clicked', async () => {
      const onChange = jest.fn()
      render(<SearchableSelect options={options} value={1} onChange={onChange} />)
      await userEvent.click(screen.getByTestId('x-icon'))
      expect(onChange).toHaveBeenCalledWith(null)
    })

    it('highlights the currently selected option in the dropdown', async () => {
      render(<SearchableSelect options={options} value={2} onChange={jest.fn()} />)
      // trigger + clear are both buttons; click the trigger (aria-haspopup="listbox")
      await userEvent.click(screen.getByRole('button', { name: /drama/i }))
      const dramaOptionBtn = screen.getAllByText('Drama')[1].closest('button')
      expect(dramaOptionBtn).toHaveClass('text-primary')
    })
  })
})
