import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Table from './Table'
import type { Column } from '@/types/table'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

type Row = { id: number; name: string; role: string }

const columns: Column<Row>[] = [
  { key: 'id', header: 'ID', width: 'xs' },
  { key: 'name', header: 'Name', width: 'md' },
  { key: 'role', header: 'Role', width: 'sm' },
]

const rows: Row[] = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'guest' },
]

function getRowKey(row: Row) {
  return row.id
}

describe('Table', () => {
  describe('normal state', () => {
    it('renders column headers', () => {
      render(<Table data={rows} columns={columns} getRowKey={getRowKey} />)
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
    })

    it('renders row data', () => {
      render(<Table data={rows} columns={columns} getRowKey={getRowKey} />)
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('calls onRowClick with the clicked row', async () => {
      const onRowClick = jest.fn()
      render(<Table data={rows} columns={columns} getRowKey={getRowKey} onRowClick={onRowClick} />)
      await userEvent.click(screen.getByText('Alice'))
      expect(onRowClick).toHaveBeenCalledWith(rows[0])
    })
  })

  describe('loading state', () => {
    it('renders skeleton rows instead of real data', () => {
      render(
        <Table data={[]} columns={columns} getRowKey={getRowKey} loading skeletonRows={3} />,
      )
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
      expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    })

    it('does not show the overlay when loading', () => {
      render(
        <Table
          data={[]}
          columns={columns}
          getRowKey={getRowKey}
          loading
          emptyMessage="No data"
        />,
      )
      expect(screen.queryByText('No data')).not.toBeInTheDocument()
    })

    it('does not render the footer when loading', () => {
      render(
        <Table
          data={rows}
          columns={columns}
          getRowKey={getRowKey}
          loading
          footer={{ page: 1, totalPages: 3, onPrev: jest.fn(), onNext: jest.fn() }}
        />,
      )
      expect(screen.queryByRole('button', { name: /prev/i })).not.toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows the error message in the overlay', () => {
      render(
        <Table data={[]} columns={columns} getRowKey={getRowKey} error="Something went wrong" />,
      )
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('shows the retry button when onRetry is provided', () => {
      render(
        <Table
          data={[]}
          columns={columns}
          getRowKey={getRowKey}
          error="Error"
          onRetry={jest.fn()}
        />,
      )
      expect(screen.getByRole('button', { name: 'common.retry' })).toBeInTheDocument()
    })

    it('calls onRetry when the retry button is clicked', async () => {
      const onRetry = jest.fn()
      render(
        <Table data={[]} columns={columns} getRowKey={getRowKey} error="Error" onRetry={onRetry} />,
      )
      await userEvent.click(screen.getByRole('button', { name: 'common.retry' }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('does not show a retry button when onRetry is omitted', () => {
      render(<Table data={[]} columns={columns} getRowKey={getRowKey} error="Error" />)
      expect(screen.queryByRole('button', { name: 'common.retry' })).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows the emptyMessage overlay when data is empty', () => {
      render(
        <Table data={[]} columns={columns} getRowKey={getRowKey} emptyMessage="Nothing here" />,
      )
      expect(screen.getByText('Nothing here')).toBeInTheDocument()
    })

    it('does not show empty overlay when data has rows', () => {
      render(
        <Table data={rows} columns={columns} getRowKey={getRowKey} emptyMessage="Nothing here" />,
      )
      expect(screen.queryByText('Nothing here')).not.toBeInTheDocument()
    })

    it('does not show empty overlay when emptyMessage is omitted', () => {
      const { container } = render(
        <Table data={[]} columns={columns} getRowKey={getRowKey} />,
      )
      const overlay = container.querySelector('.backdrop-blur-sm')
      expect(overlay).not.toBeInTheDocument()
    })
  })
})
