'use client'

import React from 'react'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { axe, type JestAxe } from 'jest-axe'
import DonutChart from './DonutChart'

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'dashboard.mode.user':       'Mine',
        'dashboard.mode.global':     'Global',
        'dashboard.chart.error':     'Error loading data',
        'dashboard.chart.noWatched': 'No watched movies yet',
      }
      return map[key] ?? key
    },
  }),
}))

// Recharts uses SVG APIs unavailable in jsdom — replace with semantically-equivalent stubs
jest.mock('recharts', () => ({
  PieChart:          ({ children }: { children: React.ReactNode }) => <svg data-testid="pie-chart">{children}</svg>,
  Pie:               () => <g data-testid="pie" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="recharts-wrapper">{children}</div>,
}))

// ResizeObserver is not implemented in jsdom; stub it so containerRef callback resolves
class ResizeObserverStub {
  callback: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) { this.callback = cb }
  observe(_element: Element) {
    this.callback(
      [{ contentRect: { width: 200, height: 200 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    )
  }
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

// ── Fixtures ─────────────────────────────────────────────────────────────────

const GENRES = [
  { name: 'Action',   count: 30 },
  { name: 'Drama',    count: 25 },
  { name: 'Comedy',   count: 20 },
  { name: 'Horror',   count: 15 },
  { name: 'Thriller', count: 10 },
]

const baseUserQuery  = { data: GENRES, isLoading: false, isError: false }
const baseGlobalQuery = { data: GENRES, isLoading: false, isError: false }

const loadingQuery = { data: undefined, isLoading: true,  isError: false }
const errorQuery   = { data: undefined, isLoading: false, isError: true  }
const emptyQuery   = { data: [],        isLoading: false, isError: false }

const AXE_OPTS: Parameters<JestAxe>[1] = {
  rules: {
    // Cannot compute colour-contrast ratios in jsdom (no layout engine)
    'color-contrast': { enabled: false },
  },
}

function renderChart(overrides: Partial<React.ComponentProps<typeof DonutChart>> = {}) {
  const props: React.ComponentProps<typeof DonutChart> = {
    title:        'Genre distribution',
    tooltipLabel: 'movies',
    tab:          'movies',
    onTabChange:  jest.fn(),
    userQuery:    baseUserQuery,
    globalQuery:  baseGlobalQuery,
    ...overrides,
  }
  return render(<DonutChart {...props} />)
}

// ── axe: accessibility in every state ────────────────────────────────────────

describe('DonutChart — axe accessibility', () => {
  it('passes axe in loading state', async () => {
    const { container } = renderChart({ userQuery: loadingQuery, globalQuery: loadingQuery })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe in error state', async () => {
    const { container } = renderChart({ userQuery: errorQuery, globalQuery: errorQuery })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe in empty state', async () => {
    const { container } = renderChart({ userQuery: emptyQuery, globalQuery: emptyQuery })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe with data (user mode)', async () => {
    const { container } = renderChart()
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe with data (global mode)', async () => {
    const { container } = renderChart({ defaultMode: 'global' })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe with showUserToggle=false (global-only)', async () => {
    const { container } = renderChart({ showUserToggle: false })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe with a single genre', async () => {
    const single = { data: [{ name: 'Action', count: 10 }], isLoading: false, isError: false }
    const { container } = renderChart({ userQuery: single, globalQuery: single })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })

  it('passes axe with 10 genres (maximum legend rows)', async () => {
    const ten = { data: [
      { name: 'Action', count: 30 }, { name: 'Drama', count: 25 },
      { name: 'Comedy', count: 20 }, { name: 'Horror', count: 15 },
      { name: 'Thriller', count: 10 }, { name: 'Sci-Fi', count: 9 },
      { name: 'Romance', count: 8 }, { name: 'Animation', count: 7 },
      { name: 'Crime', count: 6 }, { name: 'Mystery', count: 5 },
    ], isLoading: false, isError: false }
    const { container } = renderChart({ userQuery: ten, globalQuery: ten })
    expect(await axe(container, AXE_OPTS)).toHaveNoViolations()
  })
})

// ── ARIA structure ────────────────────────────────────────────────────────────

describe('DonutChart — ARIA structure', () => {
  it('wraps chart+legend in role="figure" with the title as aria-label', () => {
    renderChart({ title: 'Genre distribution' })
    const figure = screen.getByRole('figure', { name: 'Genre distribution' })
    expect(figure).toBeInTheDocument()
  })

  it('marks the SVG container as aria-hidden', () => {
    renderChart()
    const figure = screen.getByRole('figure')
    const hiddenWrapper = figure.querySelector('[aria-hidden="true"]')
    expect(hiddenWrapper).toBeInTheDocument()
  })

  it('renders legend with role="list"', () => {
    renderChart()
    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
  })

  it('renders one role="listitem" wrapper per genre', () => {
    renderChart()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(GENRES.length)
  })

  it('legend buttons have accessible names matching genre names', () => {
    renderChart()
    for (const genre of GENRES) {
      expect(screen.getByRole('button', { name: new RegExp(genre.name) })).toBeInTheDocument()
    }
  })

  it('does NOT put role="listitem" on the button element itself', () => {
    renderChart()
    const buttons = screen.getAllByRole('button')
    // Filter out non-legend buttons (toggle switch, tab toggle)
    const legendButtons = buttons.filter((b) => GENRES.some((g) => b.textContent?.includes(g.name)))
    for (const btn of legendButtons) {
      expect(btn).not.toHaveAttribute('role', 'listitem')
    }
  })

  it('each button is inside a listitem wrapper', () => {
    renderChart()
    const listitems = screen.getAllByRole('listitem')
    for (const item of listitems) {
      expect(within(item).getByRole('button')).toBeInTheDocument()
    }
  })

  it('title is visible in the card header', () => {
    renderChart({ title: 'My Genres' })
    expect(screen.getByText('My Genres')).toBeInTheDocument()
  })
})

// ── Keyboard navigation ───────────────────────────────────────────────────────

describe('DonutChart — keyboard navigation', () => {
  it('legend buttons are focusable', () => {
    renderChart()
    const btn = screen.getByRole('button', { name: /Action/i })
    act(() => { btn.focus() })
    expect(document.activeElement).toBe(btn)
  })

  it('focusing a button applies the active highlight class', () => {
    renderChart()
    const btn = screen.getByRole('button', { name: /Action/i })
    act(() => { fireEvent.focus(btn) })
    expect(btn.className).toMatch(/bg-muted/)
  })

  it('blurring a button removes the active highlight class', () => {
    renderChart()
    const btn = screen.getByRole('button', { name: /Action/i })
    act(() => { fireEvent.focus(btn) })
    act(() => { fireEvent.blur(btn) })
    expect(btn.className).not.toMatch(/bg-muted\/60/)
  })

  it('all legend buttons have type="button" (no accidental form submission)', () => {
    renderChart()
    for (const genre of GENRES) {
      const btn = screen.getByRole('button', { name: new RegExp(genre.name) })
      expect(btn).toHaveAttribute('type', 'button')
    }
  })
})

// ── State rendering ───────────────────────────────────────────────────────────

describe('DonutChart — state rendering', () => {
  it('shows no list in loading state', () => {
    renderChart({ userQuery: loadingQuery, globalQuery: loadingQuery })
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows error message in error state', () => {
    renderChart({ userQuery: errorQuery, globalQuery: errorQuery })
    expect(screen.getByText('Error loading data')).toBeInTheDocument()
  })

  it('shows empty message when user has no watched items', () => {
    renderChart({ userQuery: emptyQuery, globalQuery: emptyQuery })
    expect(screen.getByText('No watched movies yet')).toBeInTheDocument()
  })

  it('renders all genre names in the legend', () => {
    renderChart()
    for (const genre of GENRES) {
      expect(screen.getByText(genre.name)).toBeInTheDocument()
    }
  })

  it('user/global toggle is visible when showUserToggle=true', () => {
    renderChart({ showUserToggle: true })
    expect(screen.getByRole('group')).toBeInTheDocument()
  })

  it('user/global toggle is hidden when showUserToggle=false', () => {
    renderChart({ showUserToggle: false })
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })
})
