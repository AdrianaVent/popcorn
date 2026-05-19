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
type StarFilters = { rating: number }

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
      await userEvent.click(screen.getAllByRole('button')[0])
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('shows inputs again after re-expanding', async () => {
      render(<FiltersPanel schema={schema} filters={defaultFilters} onChange={jest.fn()} />)
      await userEvent.click(screen.getAllByRole('button')[0])
      await userEvent.click(screen.getAllByRole('button')[0])
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('active filter count badge', () => {
    it('shows no badge when collapsed with no active filters', async () => {
      render(<FiltersPanel schema={schema} filters={defaultFilters} onChange={jest.fn()} />)
      await userEvent.click(screen.getAllByRole('button')[0])
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
      await userEvent.click(screen.getAllByRole('button')[0])
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
      await userEvent.click(screen.getAllByRole('button')[0])
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

describe('FiltersPanel — star filter', () => {
  const starSchema: FiltersSchema<StarFilters> = [
    { key: 'rating', label: 'movies.filters.ratingGte', type: 'star' },
  ]

  it('renders 5 stars', () => {
    const { container } = render(
      <FiltersPanel schema={starSchema} filters={{ rating: 0 }} onChange={jest.fn()} />
    )
    // 5 star SVGs + 1 ChevronDownIcon in the panel header
    expect(container.querySelectorAll('svg')).toHaveLength(6)
  })

  it('calls onChange with star value * 2 when a star is clicked', () => {
    const onChange = jest.fn()
    const { container } = render(
      <FiltersPanel schema={starSchema} filters={{ rating: 0 }} onChange={onChange} />
    )
    // SVG[0] = ChevronDownIcon; SVG[1..5] = stars 1..5
    // Click star #4 (index 4) → rating=4 → stored as 8
    fireEvent.click(container.querySelectorAll('svg')[4])
    expect(onChange).toHaveBeenCalledWith({ rating: 8 })
  })

  it('hides clear button when rating is 0', () => {
    render(<FiltersPanel schema={starSchema} filters={{ rating: 0 }} onChange={jest.fn()} />)
    expect(screen.queryByLabelText('Clear')).not.toBeInTheDocument()
  })

  it('shows clear button when rating is active', () => {
    render(<FiltersPanel schema={starSchema} filters={{ rating: 8 }} onChange={jest.fn()} />)
    expect(screen.getByLabelText('Clear')).toBeInTheDocument()
  })

  it('resets rating to 0 when clear is clicked', async () => {
    const onChange = jest.fn()
    render(<FiltersPanel schema={starSchema} filters={{ rating: 8 }} onChange={onChange} />)
    await userEvent.click(screen.getByLabelText('Clear'))
    expect(onChange).toHaveBeenCalledWith({ rating: 0 })
  })

  it('counts star filter as active when rating > 0', async () => {
    render(<FiltersPanel schema={starSchema} filters={{ rating: 8 }} onChange={jest.fn()} />)
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('does not count star filter as active when rating is 0', async () => {
    render(<FiltersPanel schema={starSchema} filters={{ rating: 0 }} onChange={jest.fn()} />)
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })
})
