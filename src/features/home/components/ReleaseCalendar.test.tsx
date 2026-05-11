import { render, screen, fireEvent } from '@testing-library/react'
import ReleaseCalendar from './ReleaseCalendar'
import type { ReleaseEntry } from '@/services/tmdb/releases'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.number != null) return `S${opts.number}`
      if (opts?.count != null) return `${opts.count} ep.`
      return key
    },
  }),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: (fn: (s: { language: string }) => unknown) => fn({ language: 'en' }),
}))

jest.mock('@/components/common/MediaPoster', () => ({
  __esModule: true,
  default: () => <div data-testid="poster" />,
}))

jest.mock('@/components/ui/Text', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

jest.mock('@/components/icons', () => ({
  ChevronLeftIcon: () => <span>prev</span>,
  ChevronRightIcon: () => <span>next</span>,
  XIcon: () => <span>close</span>,
}))

jest.mock('@/features/series/getSeriesUI', () => ({
  getStatusConfig: () => null,
}))

const RELEASE: ReleaseEntry = {
  id: 1,
  title: 'Test Movie',
  date: '2025-05-15',
  poster_path: null,
  overview: 'A great movie.',
  genre_ids: [],
}

const BASE_PROPS = {
  year: 2025,
  month: 5,
  onPrevMonth: jest.fn(),
  onNextMonth: jest.fn(),
  onToday: jest.fn(),
  query: { data: [RELEASE], isLoading: false, isError: false },
}

describe('ReleaseCalendar', () => {
  describe('header', () => {
    it('shows the calendar title', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      expect(screen.getByText('calendar.title')).toBeInTheDocument()
    })

    it('shows the month name and year', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      expect(screen.getByText('May 2025')).toBeInTheDocument()
    })

    it('shows the Today button when not on the current month', () => {
      render(<ReleaseCalendar {...BASE_PROPS} year={2024} month={1} />)
      expect(screen.getByText('calendar.today')).toBeInTheDocument()
    })

    it('hides the Today button when on the current month', () => {
      const now = new Date()
      render(<ReleaseCalendar {...BASE_PROPS} year={now.getFullYear()} month={now.getMonth() + 1} />)
      expect(screen.queryByText('calendar.today')).not.toBeInTheDocument()
    })

    it('calls onPrevMonth when the prev button is clicked', () => {
      const onPrevMonth = jest.fn()
      render(<ReleaseCalendar {...BASE_PROPS} onPrevMonth={onPrevMonth} />)
      fireEvent.click(screen.getByRole('button', { name: 'prev' }))
      expect(onPrevMonth).toHaveBeenCalledTimes(1)
    })

    it('calls onNextMonth when the next button is clicked', () => {
      const onNextMonth = jest.fn()
      render(<ReleaseCalendar {...BASE_PROPS} onNextMonth={onNextMonth} />)
      fireEvent.click(screen.getByRole('button', { name: 'next' }))
      expect(onNextMonth).toHaveBeenCalledTimes(1)
    })
  })

  describe('day selection', () => {
    it('marks a day with a release indicator', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      const day15 = screen.getByRole('button', { name: /^15$/ })
      expect(day15.querySelector('.bg-primary')).not.toBeNull()
    })

    it('clicking a day with a release shows the releases panel', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      fireEvent.click(screen.getByRole('button', { name: /^15$/ }))
      expect(screen.getByText('Test Movie')).toBeInTheDocument()
    })

    it('shows the release overview in the panel', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      fireEvent.click(screen.getByRole('button', { name: /^15$/ }))
      expect(screen.getByText('A great movie.')).toBeInTheDocument()
    })

    it('clicking X closes the panel and restores the calendar', () => {
      render(<ReleaseCalendar {...BASE_PROPS} />)
      fireEvent.click(screen.getByRole('button', { name: /^15$/ }))
      expect(screen.getByText('Test Movie')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'close' }))
      expect(screen.queryByText('Test Movie')).not.toBeInTheDocument()
      expect(screen.getByText('May 2025')).toBeInTheDocument()
    })

    it('calls onEntryClick with the release id when an entry is clicked', () => {
      const onEntryClick = jest.fn()
      render(<ReleaseCalendar {...BASE_PROPS} onEntryClick={onEntryClick} />)
      fireEvent.click(screen.getByRole('button', { name: /^15$/ }))
      fireEvent.click(screen.getByText('Test Movie'))
      expect(onEntryClick).toHaveBeenCalledWith(1)
    })

    it('shows "no overview" message when overview is null', () => {
      const releaseNoOverview: ReleaseEntry = { ...RELEASE, overview: null }
      render(<ReleaseCalendar {...BASE_PROPS} query={{ data: [releaseNoOverview], isLoading: false, isError: false }} />)
      fireEvent.click(screen.getByRole('button', { name: /^15$/ }))
      expect(screen.getByText('calendar.noOverview')).toBeInTheDocument()
    })
  })

  describe('loading and error states', () => {
    it('shows a loading skeleton when isLoading is true', () => {
      const { container } = render(
        <ReleaseCalendar {...BASE_PROPS} query={{ data: undefined, isLoading: true, isError: false }} />
      )
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })

    it('shows an error message when isError is true', () => {
      render(
        <ReleaseCalendar {...BASE_PROPS} query={{ data: undefined, isLoading: false, isError: true }} />
      )
      expect(screen.getByText('calendar.error')).toBeInTheDocument()
    })
  })
})
