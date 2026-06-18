import { render, screen, fireEvent } from '@testing-library/react'
import ExportButton from './ExportButton'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/components/icons', () => ({
  DownloadIcon: () => null,
}))

describe('ExportButton', () => {
  it('does not show format options initially', () => {
    render(<ExportButton onExport={jest.fn()} />)
    expect(screen.queryByText('JSON')).not.toBeInTheDocument()
    expect(screen.queryByText('CSV')).not.toBeInTheDocument()
  })

  it('shows JSON and CSV options after clicking the toggle', () => {
    render(<ExportButton onExport={jest.fn()} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('JSON')).toBeInTheDocument()
    expect(screen.getByText('CSV')).toBeInTheDocument()
  })

  it('calls onExport with "json" and closes the dropdown', () => {
    const onExport = jest.fn()
    render(<ExportButton onExport={onExport} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('JSON'))
    expect(onExport).toHaveBeenCalledWith('json')
    expect(screen.queryByText('JSON')).not.toBeInTheDocument()
  })

  it('calls onExport with "csv" and closes the dropdown', () => {
    const onExport = jest.fn()
    render(<ExportButton onExport={onExport} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('CSV'))
    expect(onExport).toHaveBeenCalledWith('csv')
    expect(screen.queryByText('CSV')).not.toBeInTheDocument()
  })

  it('closes the dropdown on a second toggle click', () => {
    render(<ExportButton onExport={jest.fn()} />)
    const toggleBtn = screen.getByRole('button')
    fireEvent.click(toggleBtn)
    expect(screen.getByText('JSON')).toBeInTheDocument()
    fireEvent.click(toggleBtn)
    expect(screen.queryByText('JSON')).not.toBeInTheDocument()
  })
})
