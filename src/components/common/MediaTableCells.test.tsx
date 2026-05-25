import { render, screen } from '@testing-library/react'
import { TitleCell, GenresCell } from './MediaTableCells'

jest.mock('@/hooks/useTruncated', () => ({
  useTruncated: () => ({ ref: { current: null }, isTruncated: false }),
}))

const DramaIcon  = () => <svg data-testid="drama-icon" />
const ActionIcon = () => <svg data-testid="action-icon" />

jest.mock('@/config/genres', () => ({
  resolveGenreName: (id: number) => {
    const map: Record<number, string> = { 18: 'Drama', 28: 'Action', 12: 'Adventure' }
    return map[id] ?? `Genre-${id}`
  },
}))

jest.mock('@/config/genreIcons', () => ({
  getGenreIcon: (id: number) => {
    if (id === 18)           return DramaIcon
    if (id === 28 || id === 12) return ActionIcon  // same icon — deduplication case
    return null
  },
}))

describe('TitleCell', () => {
  it('renders the title text', () => {
    render(<TitleCell title="Fight Club" />)
    expect(screen.getByText('Fight Club')).toBeInTheDocument()
  })

  it('renders tooltip as disabled when not truncated', () => {
    render(<TitleCell title="Short" />)
    // Tooltip disabled=true means no tooltip trigger; text still renders
    expect(screen.getByText('Short')).toBeInTheDocument()
  })
})

describe('GenresCell', () => {
  it('renders nothing when genreIds is undefined', () => {
    const { container } = render(<GenresCell language="en" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when genreIds is empty', () => {
    const { container } = render(<GenresCell genreIds={[]} language="en" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when all genres have null icons', () => {
    // id=99 has no icon in the mock
    const { container } = render(<GenresCell genreIds={[99]} language="en" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders icon for a genre that has one', () => {
    render(<GenresCell genreIds={[18]} language="en" />)
    expect(screen.getByTestId('drama-icon')).toBeInTheDocument()
  })

  it('renders multiple distinct icons', () => {
    render(<GenresCell genreIds={[18, 28]} language="en" />)
    expect(screen.getByTestId('drama-icon')).toBeInTheDocument()
    expect(screen.getByTestId('action-icon')).toBeInTheDocument()
  })

  it('deduplicates genres that share the same icon', () => {
    // ids 28 and 12 both map to ActionIcon
    render(<GenresCell genreIds={[28, 12]} language="en" />)
    expect(screen.getAllByTestId('action-icon')).toHaveLength(1)
  })

  it('filters out genres with null icons and keeps ones with icons', () => {
    // 99 has no icon, 18 does
    render(<GenresCell genreIds={[99, 18]} language="en" />)
    expect(screen.getByTestId('drama-icon')).toBeInTheDocument()
    expect(screen.queryByText('Genre-99')).not.toBeInTheDocument()
  })
})
