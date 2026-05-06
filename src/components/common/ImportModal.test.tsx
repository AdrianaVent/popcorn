import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImportModal, { type ImportResult, type ImportRow } from './ImportModal'
import { exportAsCSV, exportAsJSON } from '@/utils/exportData'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

jest.mock('@/components/ui/Modal', () =>
  function MockModal({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
    return <div><h2>{title}</h2><div>{children}</div><div>{footer}</div></div>
  }
)

jest.mock('@/components/ui/ModalFooter', () =>
  function MockModalFooter({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>
  }
)

jest.mock('@/components/icons', () => ({
  UploadIcon: () => null,
  XIcon: () => null,
  CheckIcon: () => null,
  DownloadIcon: () => null,
}))

jest.mock('@/utils/exportData', () => ({
  exportAsJSON: jest.fn(),
  exportAsCSV: jest.fn(),
}))

const mockExportAsJSON = exportAsJSON as jest.MockedFunction<typeof exportAsJSON>
const mockExportAsCSV = exportAsCSV as jest.MockedFunction<typeof exportAsCSV>

const SUCCESS_RESULT: ImportResult = { created: 3, failed: [] }
const PARTIAL_RESULT: ImportResult = {
  created: 1,
  failed: [{ index: 2, identifier: 'bob', code: 'IMPORT_USERNAME_TAKEN' }],
}
const ZERO_RESULT: ImportResult = { created: 0, failed: [] }

const baseProps = {
  title: 'Import',
  resultsTitle: 'Results',
  description: 'Upload a file',
  formatTitle: 'Format',
  formatHint: <span>hint</span>,
  identifierLabel: 'Username',
  translateError: (code: string) => code,
  onProcess: jest.fn<Promise<ImportResult>, [ImportRow[]]>(),
  onClose: jest.fn(),
  onDone: jest.fn(),
}

function makeFile(content: string, name: string) {
  const file = new File([content], name, { type: 'text/plain' })
  // jsdom doesn't implement File.prototype.text — polyfill with the known content
  Object.defineProperty(file, 'text', { value: () => Promise.resolve(content), configurable: true })
  return file
}

function selectFile(container: HTMLElement, file: File) {
  const input = container.querySelector('input[type="file"]')!
  fireEvent.change(input, { target: { files: [file] } })
}

describe('ImportModal', () => {
  beforeEach(() => jest.clearAllMocks())

  // ─── Upload phase ──────────────────────────────────────────────────────────

  it('renders dropzone and Import button in upload phase', () => {
    render(<ImportModal {...baseProps} />)
    expect(screen.getByText('Import')).toBeInTheDocument()
    expect(screen.getByText('users.import.dropzone')).toBeInTheDocument()
    expect(screen.getByText('users.import.process')).toBeInTheDocument()
  })

  it('shows no-file error when Import is clicked without selecting a file', () => {
    render(<ImportModal {...baseProps} />)
    fireEvent.click(screen.getByText('users.import.process'))
    expect(screen.getByText('users.import.noFile')).toBeInTheDocument()
    expect(baseProps.onProcess).not.toHaveBeenCalled()
  })

  it('shows filename after a file is selected', () => {
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('[]', 'users.json'))
    expect(screen.getByText('users.json')).toBeInTheDocument()
    expect(screen.queryByText('users.import.dropzone')).not.toBeInTheDocument()
  })

  it('clears the file when the X button is clicked', () => {
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('[]', 'users.json'))
    expect(screen.getByText('users.json')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('button.cancel'))
    expect(screen.queryByText('users.json')).not.toBeInTheDocument()
    expect(screen.getByText('users.import.dropzone')).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', () => {
    render(<ImportModal {...baseProps} />)
    fireEvent.click(screen.getByText('button.cancel'))
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)
  })

  // ─── JSON parsing ──────────────────────────────────────────────────────────

  it('parses a JSON file and calls onProcess with the rows', async () => {
    baseProps.onProcess.mockResolvedValueOnce(SUCCESS_RESULT)
    const json = JSON.stringify([
      { username: 'alice', password: 'Alice1!x', role: 'guest' },
      { username: 'bob', password: 'Bob12!x', role: 'admin' },
    ])
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile(json, 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() =>
      expect(baseProps.onProcess).toHaveBeenCalledWith([
        { username: 'alice', password: 'Alice1!x', role: 'guest' },
        { username: 'bob', password: 'Bob12!x', role: 'admin' },
      ])
    )
  })

  it('shows parse error when JSON is not an array', async () => {
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('{"not":"array"}', 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() =>
      expect(screen.getByText('users.errors.IMPORT_PARSE_ERROR')).toBeInTheDocument()
    )
    expect(baseProps.onProcess).not.toHaveBeenCalled()
  })

  it('shows parse error when JSON is malformed', async () => {
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('not json {', 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() =>
      expect(screen.getByText('users.errors.IMPORT_PARSE_ERROR')).toBeInTheDocument()
    )
    expect(baseProps.onProcess).not.toHaveBeenCalled()
  })

  // ─── CSV parsing ───────────────────────────────────────────────────────────

  it('parses a CSV file and calls onProcess with the rows', async () => {
    baseProps.onProcess.mockResolvedValueOnce(SUCCESS_RESULT)
    const csv = 'username,password,role\nalice,Alice1!x,guest\nbob,Bob12!x,admin'
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile(csv, 'users.csv'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() =>
      expect(baseProps.onProcess).toHaveBeenCalledWith([
        { username: 'alice', password: 'Alice1!x', role: 'guest' },
        { username: 'bob', password: 'Bob12!x', role: 'admin' },
      ])
    )
  })

  it('handles commas inside the middle CSV column (password)', async () => {
    baseProps.onProcess.mockResolvedValueOnce(SUCCESS_RESULT)
    const csv = 'username,password,role\nalice,Pass,word1!,guest'
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile(csv, 'users.csv'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() =>
      expect(baseProps.onProcess).toHaveBeenCalledWith([
        { username: 'alice', password: 'Pass,word1!', role: 'guest' },
      ])
    )
  })

  it('calls onProcess with empty array for CSV with only a header row', async () => {
    baseProps.onProcess.mockResolvedValueOnce(ZERO_RESULT)
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('username,password,role', 'users.csv'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() =>
      expect(baseProps.onProcess).toHaveBeenCalledWith([])
    )
  })

  // ─── Results phase ─────────────────────────────────────────────────────────

  it('transitions to results phase and shows the created count', async () => {
    baseProps.onProcess.mockResolvedValueOnce(SUCCESS_RESULT)
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('[]', 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() => expect(screen.getByText('Results')).toBeInTheDocument())
    expect(screen.getByText('users.import.results.success')).toBeInTheDocument()
  })

  it('shows noneCreated message when created = 0', async () => {
    baseProps.onProcess.mockResolvedValueOnce(ZERO_RESULT)
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('[]', 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() =>
      expect(screen.getByText('users.import.results.noneCreated')).toBeInTheDocument()
    )
  })

  it('shows failed rows in a table', async () => {
    baseProps.onProcess.mockResolvedValueOnce(PARTIAL_RESULT)
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('[]', 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() => expect(screen.getByText('bob')).toBeInTheDocument())
    expect(screen.getByText('IMPORT_USERNAME_TAKEN')).toBeInTheDocument()
  })

  it('shows Download failed rows button when there are failures', async () => {
    baseProps.onProcess.mockResolvedValueOnce(PARTIAL_RESULT)
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('[]', 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() =>
      expect(screen.getByText('users.import.results.downloadFailed')).toBeInTheDocument()
    )
  })

  it('does not show Download button when all rows succeeded', async () => {
    baseProps.onProcess.mockResolvedValueOnce(SUCCESS_RESULT)
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('[]', 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() => expect(screen.getByText('Results')).toBeInTheDocument())
    expect(screen.queryByText('users.import.results.downloadFailed')).not.toBeInTheDocument()
  })

  it('calls onDone when created > 0', async () => {
    baseProps.onProcess.mockResolvedValueOnce(SUCCESS_RESULT)
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('[]', 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() => expect(baseProps.onDone).toHaveBeenCalledTimes(1))
  })

  it('does not call onDone when created = 0', async () => {
    baseProps.onProcess.mockResolvedValueOnce(ZERO_RESULT)
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('[]', 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() =>
      expect(screen.getByText('users.import.results.noneCreated')).toBeInTheDocument()
    )
    expect(baseProps.onDone).not.toHaveBeenCalled()
  })

  it('calls onClose when Accept is clicked in the results phase', async () => {
    baseProps.onProcess.mockResolvedValueOnce(SUCCESS_RESULT)
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('[]', 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() => expect(screen.getByText('button.accept')).toBeInTheDocument())
    fireEvent.click(screen.getByText('button.accept'))
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)
  })

  // ─── Download failed rows ──────────────────────────────────────────────────

  it('calls exportAsCSV when downloading failures from a CSV import', async () => {
    baseProps.onProcess.mockResolvedValueOnce(PARTIAL_RESULT)
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('username,password,role\nalice,Alice1!x,guest', 'users.csv'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() =>
      expect(screen.getByText('users.import.results.downloadFailed')).toBeInTheDocument()
    )
    fireEvent.click(screen.getByText('users.import.results.downloadFailed'))
    expect(mockExportAsCSV).toHaveBeenCalledTimes(1)
    expect(mockExportAsJSON).not.toHaveBeenCalled()
  })

  it('calls exportAsJSON when downloading failures from a JSON import', async () => {
    baseProps.onProcess.mockResolvedValueOnce(PARTIAL_RESULT)
    const { container } = render(<ImportModal {...baseProps} />)
    selectFile(container, makeFile('[]', 'users.json'))
    fireEvent.click(screen.getByText('users.import.process'))
    await waitFor(() =>
      expect(screen.getByText('users.import.results.downloadFailed')).toBeInTheDocument()
    )
    fireEvent.click(screen.getByText('users.import.results.downloadFailed'))
    expect(mockExportAsJSON).toHaveBeenCalledTimes(1)
    expect(mockExportAsCSV).not.toHaveBeenCalled()
  })
})
