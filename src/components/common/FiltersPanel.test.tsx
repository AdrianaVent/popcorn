import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FiltersPanel from './FiltersPanel'
import type { FiltersSchema } from '@/types/table'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

jest.mock('@/components/ui/DatePicker', () => {
  function MockDatePicker() { return <input type="date" data-testid="date-picker" /> }
  return MockDatePicker
})

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div data-tooltip={content}>{children}</div>
  ),
}))

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

    it('hides inputs when collapsed (aria-hidden + opacity via inline style)', async () => {
      render(<FiltersPanel schema={schema} filters={defaultFilters} onChange={jest.fn()} />)
      await userEvent.click(screen.getAllByRole('button')[0])
      // Content stays in DOM for animation; hidden from accessibility tree via aria-hidden
      // and visually via inline opacity style — use { hidden: true } to reach it
      const textbox = screen.getByRole('textbox', { hidden: true })
      expect(textbox).toBeInTheDocument()
      expect(textbox.closest('[style*="opacity: 0"]')).not.toBeNull()
    })

    it('shows inputs again after re-expanding', async () => {
      render(<FiltersPanel schema={schema} filters={defaultFilters} onChange={jest.fn()} />)
      await userEvent.click(screen.getAllByRole('button')[0])
      await userEvent.click(screen.getAllByRole('button')[0])
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('collapsed summary pills', () => {
    it('shows no summary when collapsed with no active filters', async () => {
      render(<FiltersPanel schema={schema} filters={defaultFilters} onChange={jest.fn()} />)
      await userEvent.click(screen.getAllByRole('button')[0])
      expect(screen.queryByText(/""/)).not.toBeInTheDocument()
    })

    it('shows text pill when collapsed with active title filter', async () => {
      render(
        <FiltersPanel
          schema={schema}
          filters={{ title: 'inception', year: 0 }}
          onChange={jest.fn()}
        />
      )
      await userEvent.click(screen.getAllByRole('button')[0])
      expect(screen.getByText('"inception"')).toBeInTheDocument()
    })

    it('shows pills for all active filters when collapsed', async () => {
      render(
        <FiltersPanel
          schema={schema}
          filters={{ title: 'inception', year: 2023 }}
          onChange={jest.fn()}
        />
      )
      await userEvent.click(screen.getAllByRole('button')[0])
      expect(screen.getByText('"inception"')).toBeInTheDocument()
      expect(screen.getByText('2023')).toBeInTheDocument()
    })

    it('does not show summary pills while expanded', () => {
      render(
        <FiltersPanel
          schema={schema}
          filters={{ title: 'inception', year: 2023 }}
          onChange={jest.fn()}
        />
      )
      expect(screen.queryByText('"inception"')).not.toBeInTheDocument()
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

  it('shows clear button when rating > 0 (filter is active)', async () => {
    render(<FiltersPanel schema={starSchema} filters={{ rating: 8 }} onChange={jest.fn()} />)
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(screen.getByText('common.clearFilters')).toBeInTheDocument()
  })

  it('shows no clear button when rating is 0 (filter inactive)', async () => {
    render(<FiltersPanel schema={starSchema} filters={{ rating: 0 }} onChange={jest.fn()} />)
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(screen.queryByText('common.clearFilters')).not.toBeInTheDocument()
  })

  it('summary pill tooltip shows TMDB score /10, not star equivalent', () => {
    const { container } = render(
      <FiltersPanel schema={starSchema} filters={{ rating: 8 }} onChange={jest.fn()} />
    )
    // Panel starts open — collapse it to show summary pills
    fireEvent.click(screen.getAllByRole('button')[0])
    const tooltip = container.querySelector('[data-tooltip]')
    expect(tooltip?.getAttribute('data-tooltip')).toContain('8/10')
    expect(tooltip?.getAttribute('data-tooltip')).not.toContain('4★')
  })
})
