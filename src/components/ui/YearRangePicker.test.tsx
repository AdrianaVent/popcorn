import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import YearRangePicker from './YearRangePicker'
import type { FilterOption } from '@/types/table'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

// Render SearchableSelect as a native <select> so we can inspect available options
jest.mock('./SearchableSelect', () => {
  return function MockSearchableSelect({
    options,
    value,
    onChange,
    placeholder,
  }: {
    options: FilterOption[]
    value: string | number | null
    onChange: (v: string | number | null) => void
    placeholder?: string
  }) {
    return (
      <select
        aria-label={placeholder ?? 'select'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  }
})

const YEARS: FilterOption[] = [
  { value: 2020, label: '2020' },
  { value: 2021, label: '2021' },
  { value: 2022, label: '2022' },
  { value: 2023, label: '2023' },
]

function getFromOptions() {
  return screen.getAllByRole('combobox')[0]
}
function getToOptions() {
  return screen.getAllByRole('combobox')[1]
}

describe('YearRangePicker', () => {
  it('renders two selects', () => {
    render(<YearRangePicker options={YEARS} valueFrom={null} valueTo={null} onChangeFrom={jest.fn()} onChangeTo={jest.fn()} />)
    expect(screen.getAllByRole('combobox')).toHaveLength(2)
  })

  describe('option filtering', () => {
    it('shows all years in "from" when valueTo is null', () => {
      render(<YearRangePicker options={YEARS} valueFrom={null} valueTo={null} onChangeFrom={jest.fn()} onChangeTo={jest.fn()} />)
      const from = getFromOptions()
      const fromYears = Array.from(from.querySelectorAll('option')).map((o) => o.value).filter(Boolean)
      expect(fromYears).toEqual(['2020', '2021', '2022', '2023'])
    })

    it('shows all years in "to" when valueFrom is null', () => {
      render(<YearRangePicker options={YEARS} valueFrom={null} valueTo={null} onChangeFrom={jest.fn()} onChangeTo={jest.fn()} />)
      const to = getToOptions()
      const toYears = Array.from(to.querySelectorAll('option')).map((o) => o.value).filter(Boolean)
      expect(toYears).toEqual(['2020', '2021', '2022', '2023'])
    })

    it('"from" options are capped at valueTo', () => {
      render(<YearRangePicker options={YEARS} valueFrom={null} valueTo={2022} onChangeFrom={jest.fn()} onChangeTo={jest.fn()} />)
      const from = getFromOptions()
      const fromYears = Array.from(from.querySelectorAll('option')).map((o) => o.value).filter(Boolean)
      expect(fromYears).toEqual(['2020', '2021', '2022'])
      expect(fromYears).not.toContain('2023')
    })

    it('"to" options start at valueFrom', () => {
      render(<YearRangePicker options={YEARS} valueFrom={2021} valueTo={null} onChangeFrom={jest.fn()} onChangeTo={jest.fn()} />)
      const to = getToOptions()
      const toYears = Array.from(to.querySelectorAll('option')).map((o) => o.value).filter(Boolean)
      expect(toYears).toEqual(['2021', '2022', '2023'])
      expect(toYears).not.toContain('2020')
    })

    it('"from" excludes years after valueTo and "to" excludes years before valueFrom', () => {
      render(<YearRangePicker options={YEARS} valueFrom={2022} valueTo={2022} onChangeFrom={jest.fn()} onChangeTo={jest.fn()} />)
      const from = getFromOptions()
      const to = getToOptions()
      const fromYears = Array.from(from.querySelectorAll('option')).map((o) => o.value).filter(Boolean)
      const toYears = Array.from(to.querySelectorAll('option')).map((o) => o.value).filter(Boolean)
      // fromOptions: years <= 2022 → [2020, 2021, 2022]
      expect(fromYears).toEqual(['2020', '2021', '2022'])
      expect(fromYears).not.toContain('2023')
      // toOptions: years >= 2022 → [2022, 2023]
      expect(toYears).toEqual(['2022', '2023'])
      expect(toYears).not.toContain('2021')
    })
  })

  describe('callbacks', () => {
    it('calls onChangeFrom with the selected number', async () => {
      const onChangeFrom = jest.fn()
      render(<YearRangePicker options={YEARS} valueFrom={null} valueTo={null} onChangeFrom={onChangeFrom} onChangeTo={jest.fn()} />)
      await userEvent.selectOptions(getFromOptions(), '2021')
      expect(onChangeFrom).toHaveBeenCalledWith(2021)
    })

    it('calls onChangeTo with the selected number', async () => {
      const onChangeTo = jest.fn()
      render(<YearRangePicker options={YEARS} valueFrom={null} valueTo={null} onChangeFrom={jest.fn()} onChangeTo={onChangeTo} />)
      await userEvent.selectOptions(getToOptions(), '2023')
      expect(onChangeTo).toHaveBeenCalledWith(2023)
    })

    it('calls onChangeFrom with null when cleared', async () => {
      const onChangeFrom = jest.fn()
      render(<YearRangePicker options={YEARS} valueFrom={2021} valueTo={null} onChangeFrom={onChangeFrom} onChangeTo={jest.fn()} />)
      await userEvent.selectOptions(getFromOptions(), '')
      expect(onChangeFrom).toHaveBeenCalledWith(null)
    })

    it('calls onChangeTo with null when cleared', async () => {
      const onChangeTo = jest.fn()
      render(<YearRangePicker options={YEARS} valueFrom={null} valueTo={2022} onChangeFrom={jest.fn()} onChangeTo={onChangeTo} />)
      await userEvent.selectOptions(getToOptions(), '')
      expect(onChangeTo).toHaveBeenCalledWith(null)
    })
  })
})
