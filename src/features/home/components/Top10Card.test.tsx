'use client'

import React from 'react'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import Top10Card from './Top10Card'
import type { Top10Item } from '@/features/home/hooks/useTop10'

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'nav.movies':               'Movies',
        'nav.series':               'Series',
        'dashboard.mode.user':      'Mine',
        'dashboard.mode.global':    'Global',
        'dashboard.chart.error':    'Error loading data',
        'dashboard.top10.title':    'Top 10',
        'dashboard.top10.allGenres': 'All genres',
        'dashboard.top10.empty':    'No watched items yet',
      }
      return map[key] ?? key
    },
  }),
}))

jest.mock('@/store/languageStore', () => ({
  useLanguageStore: () => ({ language: 'en' }),
}))

jest.mock('@/config/tmdb', () => ({
  TMDB_LANGUAGE: { en: 'en-US', es: 'es-ES' },
}))

const GENRE_NAMES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 18: 'Drama',
  10759: 'Action & Adventure', 9648: 'Mystery',
}
jest.mock('@/config/genres', () => ({
  resolveGenreName: (id: number) => GENRE_NAMES[id] ?? `Genre ${id}`,
  MOVIE_GENRE_IDS:  [28, 12, 18],
  SERIES_GENRE_IDS: [10759, 18, 9648],
}))

jest.mock('@/config/genreIcons', () => ({
  getGenreIcon: () => null,
}))

jest.mock('@/features/home/hooks/useTop10', () => ({
  useGlobalMovieTop10ByGenre:  () => ({ data: undefined, isLoading: false, isError: false }),
  useGlobalSeriesTop10ByGenre: () => ({ data: undefined, isLoading: false, isError: false }),
  useUserMovieTop10ByGenre:    () => ({ data: undefined, isLoading: false, isError: false }),
  useUserSeriesTop10ByGenre:   () => ({ data: undefined, isLoading: false, isError: false }),
}))

jest.mock('@/components/common/MediaPoster', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="poster">{title}</div>,
}))

// Render portal content inline so axe/queries can find it
jest.mock('react-dom', () => ({
  ...jest.requireActual<typeof import('react-dom')>('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}))

// ContentTabToggle uses Tooltip (portal + positioning) — stub with accessible equivalent
jest.mock('@/components/ui/ContentTabToggle', () => ({
  __esModule: true,
  default: ({ tab, onTabChange }: { tab: string; onTabChange: (t: string) => void }) => (
    <div>
      <button type="button" aria-label="Movies" aria-pressed={tab === 'movies'} onClick={() => onTabChange('movies')}>Movies</button>
      <button type="button" aria-label="Series" aria-pressed={tab === 'series'} onClick={() => onTabChange('series')}>Series</button>
    </div>
  ),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeItem(id: number, title: string, overrides: Partial<Top10Item> = {}): Top10Item {
  return {
    id,
    title,
    posterPath: null,
    year: 2024,
    tmdbScore: 8.5,
    personalRating: null,
    genre_ids: [28],
    ...overrides,
  }
}

// Titles without numeric overlap so regex /Title/ can't match another entry
const TITLES = [
  'Inception', 'Dune', 'Oppenheimer', 'Interstellar', 'Parasite',
  'Arrival', 'Gravity', 'Tenet', 'Memento', 'Joker',
]
const ITEMS: Top10Item[] = TITLES.map((title, i) => makeItem(i + 1, title))

const loadingQuery = { data: undefined, isLoading: true,  isError: false }
const errorQuery   = { data: undefined, isLoading: false, isError: true  }
const dataQuery    = { data: ITEMS,     isLoading: false, isError: false }
const emptyQuery   = { data: [],        isLoading: false, isError: false }

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: { 'color-contrast': { enabled: false } },
}

function renderCard(overrides: Partial<React.ComponentProps<typeof Top10Card>> = {}) {
  const props: React.ComponentProps<typeof Top10Card> = {
    tab:               'movies',
    onTabChange:       jest.fn(),
    globalMovieQuery:  dataQuery,
    globalSeriesQuery: dataQuery,
    userMovieItems:    [],
    userSeriesItems:   [],
    userMoviePool:     [],
    userSeriesPool:    [],
    defaultMode:       'global',
    showUserToggle:    true,
    onItemClick:       jest.fn(),
    ...overrides,
  }
  return render(<Top10Card {...props} />)
}

// ── axe: every state ─────────────────────────────────────────────────────────

describe('Top10Card — axe accessibility', () => {
  it('passes axe in loading state (global)', async () => {
    const { container } = renderCard({ globalMovieQuery: loadingQuery })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe in error state', async () => {
    const { container } = renderCard({ globalMovieQuery: errorQuery })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe in empty state (global)', async () => {
    const { container } = renderCard({ globalMovieQuery: emptyQuery })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe with 10 items (global mode)', async () => {
    const { container } = renderCard()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe in user mode with personal ratings', async () => {
    const rated = ITEMS.map((item) => ({ ...item, personalRating: 4 as const }))
    const { container } = renderCard({
      defaultMode:    'user',
      userMovieItems: rated,
    })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe in user mode with no personal ratings', async () => {
    const { container } = renderCard({
      defaultMode:    'user',
      userMovieItems: ITEMS,
    })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe with showUserToggle=false (global-only)', async () => {
    const { container } = renderCard({ showUserToggle: false })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe on series tab', async () => {
    const { container } = renderCard({ tab: 'series', globalSeriesQuery: dataQuery })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe with genre dropdown open', async () => {
    const { container } = renderCard()
    const genreBtn = screen.getByRole('button', { name: /All genres/i })
    act(() => { fireEvent.click(genreBtn) })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

// ── ARIA structure ────────────────────────────────────────────────────────────

describe('Top10Card — ARIA structure', () => {
  it('renders an ordered list with aria-label matching the card title', () => {
    renderCard()
    const list = screen.getByRole('list', { name: 'Top 10' })
    expect(list.tagName).toBe('OL')
  })

  it('renders one list item per entry', () => {
    renderCard()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(ITEMS.length)
  })

  it('each list item button has accessible name from the movie title', () => {
    renderCard()
    for (const item of ITEMS) {
      // Use within the list to avoid matching genre/mode buttons
      const list = screen.getByRole('list', { name: 'Top 10' })
      expect(within(list).getByRole('button', { name: new RegExp(item.title, 'i') })).toBeInTheDocument()
    }
  })

  it('genre dropdown trigger has aria-expanded=false when closed', () => {
    renderCard()
    const trigger = screen.getByRole('button', { name: /All genres/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('genre dropdown trigger has aria-expanded=true when open', () => {
    renderCard()
    const trigger = screen.getByRole('button', { name: /All genres/i })
    act(() => { fireEvent.click(trigger) })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('star score has aria-label with numeric value', () => {
    renderCard()
    const scoreSpans = document.querySelectorAll('[aria-label$="/ 10"]')
    expect(scoreSpans.length).toBeGreaterThan(0)
    scoreSpans.forEach((span) => {
      expect(span.getAttribute('aria-label')).toMatch(/^\d+\.\d+ \/ 10$/)
    })
  })

  it('star character is aria-hidden', () => {
    renderCard()
    const starSpans = document.querySelectorAll('[aria-hidden="true"]')
    const starChars = Array.from(starSpans).filter((el) => el.textContent?.includes('★'))
    expect(starChars.length).toBeGreaterThan(0)
  })

  it('personal rating uses aria-label when available', () => {
    const rated = ITEMS.map((item) => ({ ...item, personalRating: 4 as typeof item.personalRating }))
    renderCard({ defaultMode: 'user', userMovieItems: rated })
    // personalRating 4 → ×2 = 8.0 / 10
    const scoreSpans = document.querySelectorAll('[aria-label="8.0 / 10"]')
    expect(scoreSpans.length).toBeGreaterThan(0)
  })
})

// ── HC: yellow color classes ──────────────────────────────────────────────────

describe('Top10Card — HC color classes on star scores', () => {
  it('global mode score has hc:text-yellow-700 class', () => {
    renderCard({ defaultMode: 'global' })
    const scoreSpan = document.querySelector('[aria-label="8.5 / 10"]')
    expect(scoreSpan?.className).toMatch(/hc:text-yellow-700/)
  })

  it('user mode with personal rating has hc:text-yellow-700 class', () => {
    const rated = ITEMS.map((item) => ({ ...item, personalRating: 4 as typeof item.personalRating }))
    renderCard({ defaultMode: 'user', userMovieItems: rated })
    const scoreSpan = document.querySelector('[aria-label="8.0 / 10"]')
    expect(scoreSpan?.className).toMatch(/hc:text-yellow-700/)
  })

  it('user mode with no rating has hc:text-muted-foreground class (no opacity in HC)', () => {
    renderCard({ defaultMode: 'user', userMovieItems: ITEMS })
    const scoreSpan = document.querySelector('[aria-label="8.5 / 10"]')
    expect(scoreSpan?.className).toMatch(/hc:text-muted-foreground/)
  })
})

// ── Interaction ───────────────────────────────────────────────────────────────

describe('Top10Card — interaction', () => {
  it('clicking a list item calls onItemClick with correct type and id', () => {
    const onItemClick = jest.fn()
    renderCard({ onItemClick })
    const list = screen.getByRole('list', { name: 'Top 10' })
    const btn = within(list).getByRole('button', { name: /Inception/i })
    fireEvent.click(btn)
    expect(onItemClick).toHaveBeenCalledWith('movie', 1)
  })

  it('clicking a series list item passes type="series"', () => {
    const onItemClick = jest.fn()
    renderCard({ tab: 'series', globalSeriesQuery: dataQuery, onItemClick })
    const list = screen.getByRole('list', { name: 'Top 10' })
    const btn = within(list).getByRole('button', { name: /Inception/i })
    fireEvent.click(btn)
    expect(onItemClick).toHaveBeenCalledWith('series', 1)
  })

  it('genre dropdown opens and closes on trigger click', () => {
    renderCard()
    const trigger = screen.getByRole('button', { name: /All genres/i })

    act(() => { fireEvent.click(trigger) })
    // Dropdown renders all genre options
    expect(screen.getByRole('button', { name: /Adventure/i })).toBeInTheDocument()

    act(() => { fireEvent.click(trigger) })
    expect(screen.queryByRole('button', { name: /Adventure/i })).not.toBeInTheDocument()
  })

  it('user/global toggle is visible when showUserToggle=true', () => {
    renderCard({ showUserToggle: true })
    expect(screen.getByRole('group')).toBeInTheDocument()
  })

  it('user/global toggle is hidden when showUserToggle=false', () => {
    renderCard({ showUserToggle: false })
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })
})
