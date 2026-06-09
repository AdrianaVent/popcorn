import { render, screen, fireEvent } from '@testing-library/react'
import ReminderItem from './ReminderItem'
import { getGenreIcon } from '@/config/genreIcons'
import type { LucideIcon } from 'lucide-react'
import type { ReleaseEntry } from '@/services/tmdb/releases'

const mockGetGenreIcon = jest.mocked(getGenreIcon)

let mockRole = 'guest'
let mockIsWatched = false
let mockIsInWatchlist = false
const mockToggleWatchlist = jest.fn()

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/components/common/MediaPoster', () => ({
  __esModule: true,
  default: () => <div data-testid="poster" />,
}))

jest.mock('@/components/ui/Text', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

jest.mock('@/components/ui/Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/icons', () => ({
  HeartIcon: () => <span data-testid="heart-icon" />,
}))

jest.mock('@/config/genreIcons', () => ({ getGenreIcon: jest.fn(() => null) }))
jest.mock('@/hooks/useTruncated', () => ({
  useTruncated: () => ({ ref: { current: null }, isTruncated: false }),
}))

jest.mock('@/features/home/hooks/useReleaseWatchlistToggle', () => ({
  useReleaseWatchlistToggle: () => ({
    role: mockRole,
    isWatched: mockIsWatched,
    isInWatchlist: mockIsInWatchlist,
    handleToggleWatchlist: mockToggleWatchlist,
  }),
}))

const RELEASE: ReleaseEntry = {
  id: 1,
  title: 'Test Movie',
  date: '2026-06-05',
  poster_path: null,
  overview: 'An overview.',
  genre_ids: [],
}

beforeEach(() => {
  mockRole = 'guest'
  mockIsWatched = false
  mockIsInWatchlist = false
  mockToggleWatchlist.mockReset()
})

describe('ReminderItem — role="button" and keyboard accessibility', () => {
  it('renders with role="button" and tabIndex=0', () => {
    render(<ReminderItem release={RELEASE} />)
    const btn = screen.getByRole('button', { name: /Test Movie/ })
    expect(btn).toHaveAttribute('tabindex', '0')
  })

  it('calls onEntryClick when clicked', () => {
    const onEntryClick = jest.fn()
    render(<ReminderItem release={RELEASE} onEntryClick={onEntryClick} />)
    fireEvent.click(screen.getByRole('button', { name: /Test Movie/ }))
    expect(onEntryClick).toHaveBeenCalledWith(1)
  })

  it('calls onEntryClick when Enter key is pressed', () => {
    const onEntryClick = jest.fn()
    render(<ReminderItem release={RELEASE} onEntryClick={onEntryClick} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Test Movie/ }), { key: 'Enter' })
    expect(onEntryClick).toHaveBeenCalledWith(1)
  })

  it('calls onEntryClick when Space key is pressed', () => {
    const onEntryClick = jest.fn()
    render(<ReminderItem release={RELEASE} onEntryClick={onEntryClick} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Test Movie/ }), { key: ' ' })
    expect(onEntryClick).toHaveBeenCalledWith(1)
  })

  it('does not call onEntryClick on other key presses', () => {
    const onEntryClick = jest.fn()
    render(<ReminderItem release={RELEASE} onEntryClick={onEntryClick} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Test Movie/ }), { key: 'Tab' })
    expect(onEntryClick).not.toHaveBeenCalled()
  })
})

describe('ReminderItem — watchlist toggle visibility', () => {
  it('shows the heart button for a guest user', () => {
    render(<ReminderItem release={RELEASE} />)
    expect(screen.queryByTestId('heart-icon')).not.toBeNull()
  })

  it('hides the heart button for an admin user', () => {
    mockRole = 'admin'
    render(<ReminderItem release={RELEASE} />)
    expect(screen.queryByTestId('heart-icon')).toBeNull()
  })

  it('hides the heart button when the entry is already watched', () => {
    mockIsWatched = true
    render(<ReminderItem release={RELEASE} />)
    expect(screen.queryByTestId('heart-icon')).toBeNull()
  })
})

describe('ReminderItem — watchlist toggle aria states', () => {
  it('renders the watchlist button with aria-pressed="false" when not in watchlist', () => {
    render(<ReminderItem release={RELEASE} />)
    const btn = screen.getByRole('button', { name: 'myList.watchlist.add' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders the watchlist button with aria-pressed="true" when in watchlist', () => {
    mockIsInWatchlist = true
    render(<ReminderItem release={RELEASE} />)
    const btn = screen.getByRole('button', { name: 'myList.watchlist.remove' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls handleToggleWatchlist when the heart button is clicked', () => {
    render(<ReminderItem release={RELEASE} />)
    fireEvent.click(screen.getByRole('button', { name: 'myList.watchlist.add' }))
    expect(mockToggleWatchlist).toHaveBeenCalledTimes(1)
  })
})

describe('ReminderItem — genre icon deduplication', () => {
  const IconA = () => <span data-testid="icon-a" />
  const IconB = () => <span data-testid="icon-b" />

  afterEach(() => mockGetGenreIcon.mockReturnValue(null))

  it('renders only one icon when two genre_ids share the same icon', () => {
    mockGetGenreIcon.mockImplementation(
      (id) => (id === 28 || id === 12 ? IconA : null) as LucideIcon | null,
    )
    render(<ReminderItem release={{ ...RELEASE, genre_ids: [28, 12] }} />)
    expect(screen.getAllByTestId('icon-a')).toHaveLength(1)
  })

  it('renders two icons when genre_ids have different icons', () => {
    mockGetGenreIcon.mockImplementation(
      (id) => (id === 28 ? IconA : id === 18 ? IconB : null) as LucideIcon | null,
    )
    render(<ReminderItem release={{ ...RELEASE, genre_ids: [28, 18] }} />)
    expect(screen.getAllByTestId('icon-a')).toHaveLength(1)
    expect(screen.getAllByTestId('icon-b')).toHaveLength(1)
  })
})
