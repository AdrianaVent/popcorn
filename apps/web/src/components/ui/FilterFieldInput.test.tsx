import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterFieldInput from './FilterFieldInput'
import type { FilterField } from '@/types/table'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

jest.mock('@/components/ui/DatePicker', () => {
  return function MockDatePicker({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
    return <input data-testid="date-picker" type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)} />
  }
})

jest.mock('@/components/ui/StarRating', () => {
  return function MockStarRating({ value, onChange }: { value: number | null; onChange?: (v: number) => void }) {
    return <button data-testid="star-rating" onClick={() => onChange?.(3)}>{value ?? 'null'}</button>
  }
})

jest.mock('@/components/ui/MultiSelectChips', () => {
  return function MockMultiSelectChips({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
    return <button data-testid="multi-select" onClick={() => onChange([1, 2])}>{value.join(',')}</button>
  }
})

jest.mock('@/components/ui/SearchableSelect', () => {
  return function MockSearchableSelect({ value, onChange, options }: {
    value: string | number | null
    onChange: (v: string | number | null) => void
    options: Array<{ value: string | number; label: string }>
  }) {
    return (
      <select data-testid="searchable-select" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }
})

jest.mock('@/components/ui/YearRangePicker', () => {
  return function MockYearRangePicker({ valueFrom, valueTo, onChangeFrom, onChangeTo }: {
    valueFrom: number | null
    valueTo: number | null
    onChangeFrom: (v: number | null) => void
    onChangeTo: (v: number | null) => void
  }) {
    return (
      <div data-testid="year-range">
        <button data-testid="year-from" onClick={() => onChangeFrom(2020)}>{valueFrom ?? 'null'}</button>
        <button data-testid="year-to" onClick={() => onChangeTo(2023)}>{valueTo ?? 'null'}</button>
      </div>
    )
  }
})

type TestFilters = Record<string, unknown>

function makeField(overrides: Partial<FilterField<TestFilters>>): FilterField<TestFilters> {
  return { key: 'field', label: 'Label', type: 'text', ...overrides }
}

const baseFilters: TestFilters = { field: '' }
const noop = jest.fn()

describe('FilterFieldInput', () => {
  beforeEach(() => noop.mockClear())

  describe('text', () => {
    it('renders a text input with the current value', () => {
      render(<FilterFieldInput field={makeField({ type: 'text' })} value="hello" filters={baseFilters} onChange={noop} />)
      expect(screen.getByRole('textbox')).toHaveValue('hello')
    })

    it('calls onChange with updated value on input change', async () => {
      render(<FilterFieldInput field={makeField({ type: 'text' })} value="" filters={baseFilters} onChange={noop} />)
      await userEvent.type(screen.getByRole('textbox'), 'a')
      expect(noop).toHaveBeenCalledWith({ field: 'a' })
    })
  })

  describe('number', () => {
    it('renders a number input', () => {
      render(<FilterFieldInput field={makeField({ type: 'number', min: 0, max: 10 })} value={5} filters={baseFilters} onChange={noop} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(5)
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '10')
    })

    it('calls onChange with numeric value', async () => {
      render(<FilterFieldInput field={makeField({ type: 'number' })} value={''} filters={baseFilters} onChange={noop} />)
      await userEvent.type(screen.getByRole('spinbutton'), '7')
      expect(noop).toHaveBeenCalledWith({ field: 7 })
    })

    it('calls onChange with empty string when input is cleared', async () => {
      render(<FilterFieldInput field={makeField({ type: 'number' })} value={5} filters={baseFilters} onChange={noop} />)
      await userEvent.clear(screen.getByRole('spinbutton'))
      expect(noop).toHaveBeenCalledWith({ field: '' })
    })
  })

  describe('boolean', () => {
    it('renders a checkbox', () => {
      render(<FilterFieldInput field={makeField({ type: 'boolean' })} value={false} filters={baseFilters} onChange={noop} />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('reflects the current checked state', () => {
      render(<FilterFieldInput field={makeField({ type: 'boolean' })} value={true} filters={baseFilters} onChange={noop} />)
      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('calls onChange when toggled', async () => {
      render(<FilterFieldInput field={makeField({ type: 'boolean' })} value={false} filters={baseFilters} onChange={noop} />)
      await userEvent.click(screen.getByRole('checkbox'))
      expect(noop).toHaveBeenCalledWith({ field: true })
    })
  })

  describe('select', () => {
    const field = makeField({
      type: 'select',
      options: [
        { value: 'admin', label: 'roles.admin' },
        { value: 'guest', label: 'roles.guest' },
      ],
    })

    it('renders a native select with options', () => {
      render(<FilterFieldInput field={field} value="admin" filters={baseFilters} onChange={noop} />)
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('roles.admin')).toBeInTheDocument()
      expect(screen.getByText('roles.guest')).toBeInTheDocument()
    })

    it('returns null when options are missing', () => {
      const { container } = render(<FilterFieldInput field={makeField({ type: 'select' })} value="" filters={baseFilters} onChange={noop} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('calls onChange with selected value', async () => {
      render(<FilterFieldInput field={field} value="" filters={baseFilters} onChange={noop} />)
      await userEvent.selectOptions(screen.getByRole('combobox'), 'guest')
      expect(noop).toHaveBeenCalledWith({ field: 'guest' })
    })

    it('calls onChange with undefined when "all" option is selected', async () => {
      render(<FilterFieldInput field={field} value="admin" filters={baseFilters} onChange={noop} />)
      await userEvent.selectOptions(screen.getByRole('combobox'), '')
      expect(noop).toHaveBeenCalledWith({ field: undefined })
    })
  })

  describe('date', () => {
    it('renders the DatePicker', () => {
      render(<FilterFieldInput field={makeField({ type: 'date' })} value="2024-01-15" filters={baseFilters} onChange={noop} />)
      expect(screen.getByTestId('date-picker')).toBeInTheDocument()
    })

    it('calls onChange when date changes', async () => {
      render(<FilterFieldInput field={makeField({ type: 'date' })} value="" filters={baseFilters} onChange={noop} />)
      await userEvent.type(screen.getByTestId('date-picker'), '2024-06-01')
      expect(noop).toHaveBeenCalled()
    })
  })

  describe('star', () => {
    it('renders StarRating', () => {
      render(<FilterFieldInput field={makeField({ type: 'star' })} value={0} filters={baseFilters} onChange={noop} />)
      expect(screen.getByTestId('star-rating')).toBeInTheDocument()
    })

    it('does not show clear button when value is 0', () => {
      render(<FilterFieldInput field={makeField({ type: 'star' })} value={0} filters={baseFilters} onChange={noop} />)
      expect(screen.queryByLabelText('common.clear')).not.toBeInTheDocument()
    })

    it('shows clear button when value is greater than 0', () => {
      render(<FilterFieldInput field={makeField({ type: 'star' })} value={6} filters={baseFilters} onChange={noop} />)
      expect(screen.getByLabelText('common.clear')).toBeInTheDocument()
    })

    it('calls onChange with 0 when clear is clicked', async () => {
      render(<FilterFieldInput field={makeField({ type: 'star' })} value={6} filters={baseFilters} onChange={noop} />)
      await userEvent.click(screen.getByLabelText('common.clear'))
      expect(noop).toHaveBeenCalledWith({ field: 0 })
    })

    it('calls onChange with rating * 2 when StarRating fires', async () => {
      render(<FilterFieldInput field={makeField({ type: 'star' })} value={0} filters={baseFilters} onChange={noop} />)
      await userEvent.click(screen.getByTestId('star-rating'))
      // Mock fires onChange(3), component converts to 3 * 2 = 6
      expect(noop).toHaveBeenCalledWith({ field: 6 })
    })
  })

  describe('searchable-select', () => {
    const field = makeField({
      type: 'searchable-select',
      options: [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
      ],
    })

    it('renders SearchableSelect', () => {
      render(<FilterFieldInput field={field} value="en" filters={baseFilters} onChange={noop} />)
      expect(screen.getByTestId('searchable-select')).toBeInTheDocument()
    })

    it('returns null when options are missing', () => {
      const { container } = render(<FilterFieldInput field={makeField({ type: 'searchable-select' })} value={null} filters={baseFilters} onChange={noop} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('calls onChange with selected value', async () => {
      render(<FilterFieldInput field={field} value={null} filters={baseFilters} onChange={noop} />)
      await userEvent.selectOptions(screen.getByTestId('searchable-select'), 'es')
      expect(noop).toHaveBeenCalledWith({ field: 'es' })
    })
  })

  describe('year-range', () => {
    const field = makeField({
      type: 'year-range',
      keyTo: 'fieldTo',
      options: [{ value: 2020, label: '2020' }, { value: 2021, label: '2021' }],
    })
    const filters: TestFilters = { field: 2020, fieldTo: 2021 }

    it('renders YearRangePicker', () => {
      render(<FilterFieldInput field={field} value={2020} filters={filters} onChange={noop} />)
      expect(screen.getByTestId('year-range')).toBeInTheDocument()
    })

    it('returns null when options are missing', () => {
      const { container } = render(<FilterFieldInput field={makeField({ type: 'year-range' })} value={null} filters={baseFilters} onChange={noop} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('returns null when keyTo is missing', () => {
      const { container } = render(<FilterFieldInput field={makeField({ type: 'year-range', options: [{ value: 2020, label: '2020' }] })} value={null} filters={baseFilters} onChange={noop} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('calls onChange with updated "from" year', async () => {
      render(<FilterFieldInput field={field} value={null} filters={filters} onChange={noop} />)
      await userEvent.click(screen.getByTestId('year-from'))
      expect(noop).toHaveBeenCalledWith({ ...filters, field: 2020 })
    })

    it('calls onChange with updated "to" year', async () => {
      render(<FilterFieldInput field={field} value={null} filters={filters} onChange={noop} />)
      await userEvent.click(screen.getByTestId('year-to'))
      expect(noop).toHaveBeenCalledWith({ ...filters, fieldTo: 2023 })
    })
  })

  describe('genre-multi', () => {
    const field = makeField({
      type: 'genre-multi',
      options: [{ value: 28, label: 'Action' }],
    })

    it('renders MultiSelectChips', () => {
      render(<FilterFieldInput field={field} value={[28]} filters={baseFilters} onChange={noop} />)
      expect(screen.getByTestId('multi-select')).toBeInTheDocument()
    })

    it('returns null when options are missing', () => {
      const { container } = render(<FilterFieldInput field={makeField({ type: 'genre-multi' })} value={[]} filters={baseFilters} onChange={noop} />)
      expect(container).toBeEmptyDOMElement()
    })

    it('calls onChange when selection changes', async () => {
      render(<FilterFieldInput field={field} value={[]} filters={baseFilters} onChange={noop} />)
      await userEvent.click(screen.getByTestId('multi-select'))
      expect(noop).toHaveBeenCalledWith({ field: [1, 2] })
    })
  })
})
