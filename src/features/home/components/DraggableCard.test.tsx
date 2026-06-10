import { render, screen } from '@testing-library/react'
import DraggableCard from './DraggableCard'

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => undefined } },
}))

describe('DraggableCard', () => {
  it('renders children', () => {
    render(
      <DraggableCard id="top10" isDragMode={false}>
        <div>card content</div>
      </DraggableCard>,
    )
    expect(screen.getByText('card content')).toBeInTheDocument()
  })

  it('does not show drag handle when not in drag mode', () => {
    render(
      <DraggableCard id="top10" isDragMode={false}>
        <div>card content</div>
      </DraggableCard>,
    )
    expect(screen.queryByLabelText('Drag to reorder')).not.toBeInTheDocument()
  })

  it('shows drag handle button when in drag mode', () => {
    render(
      <DraggableCard id="top10" isDragMode>
        <div>card content</div>
      </DraggableCard>,
    )
    expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument()
  })

  it('still renders children when in drag mode', () => {
    render(
      <DraggableCard id="top10" isDragMode>
        <div>card content</div>
      </DraggableCard>,
    )
    expect(screen.getByText('card content')).toBeInTheDocument()
  })

  it('works for all card ids', () => {
    const ids = ['top10', 'calendar', 'stats', 'genres'] as const
    ids.forEach((id) => {
      const { unmount } = render(
        <DraggableCard id={id} isDragMode>
          <div>{id}</div>
        </DraggableCard>,
      )
      expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument()
      unmount()
    })
  })
})
