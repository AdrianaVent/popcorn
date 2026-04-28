import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FiltersPanel from './FiltersPanel'
import type { FiltersSchema } from '@/types/table'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/components/ui/DatePicker', () => {
  function MockDatePicker() { return <input type="date" data-testid="date-picker" /> }
  return MockDatePicker
})

type Filters = { title: string; year: number }

const schema: FiltersSchema<Filters> = [
  { key: 'title', label: 'movies.filters.title', type: 'text' },
  { key: 'year',  label: 'movies.filters.year',  type: 'number' },
]

const defaultFilters: Filters = { title: '', year: 0 }

describe('FiltersPanel', () => {
  describe('collapse / expand', () => {
    it('renders inputs by default (expanded)', () => {
      render(<FiltersPanel schema={schema} filters={defaultFilters} onChange={jest.fn()} />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('hides inputs when collapsed', async () => {
      render(<FiltersPanel schema={schema} filters={defaultFilters} onChange={jest.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('shows inputs again after re-expanding', async () => {
      render(<FiltersPanel schema={schema} filters={defaultFilters} onChange={jest.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('active filter count badge', () => {
    it('shows no badge when collapsed with no active filters', async () => {
      render(<FiltersPanel schema={schema} filters={defaultFilters} onChange={jest.fn()} />)
      await userEvent.click(screen.getByRole('button'))
      expect(screen.queryByText('1')).not.toBeInTheDocument()
      expect(screen.queryByText('2')).not.toBeInTheDocument()
    })

    it('shows count badge when collapsed with active filters', async () => {
      render(
        <FiltersPanel
          schema={schema}
          filters={{ title: 'inception', year: 0 }}
          onChange={jest.fn()}
        />
      )
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('counts all active filters', async () => {
      render(
        <FiltersPanel
          schema={schema}
          filters={{ title: 'inception', year: 2023 }}
          onChange={jest.fn()}
        />
      )
      await userEvent.click(screen.getByRole('button'))
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('does not show badge while expanded', () => {
      render(
        <FiltersPanel
          schema={schema}
          filters={{ title: 'inception', year: 2023 }}
          onChange={jest.fn()}
        />
      )
      expect(screen.queryByText('2')).not.toBeInTheDocument()
    })
  })

  describe('input interactions', () => {
    it('calls onChange with updated text value', async () => {
      const onChange = jest.fn()
      render(<FiltersPanel schema={schema} filters={defaultFilters} onChange={onChange} />)
      await userEvent.type(screen.getByRole('textbox'), 'a')
      expect(onChange).toHaveBeenLastCalledWith({ title: 'a', year: 0 })
    })

    it('calls onChange with updated number value', () => {
      const onChange = jest.fn()
      render(<FiltersPanel schema={schema} filters={defaultFilters} onChange={onChange} />)
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '7' } })
      expect(onChange).toHaveBeenLastCalledWith({ title: '', year: 7 })
    })
  })
})
