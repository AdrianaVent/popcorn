import { toCSV, exportAsJSON, exportAsCSV } from './exportData'

const rows = [
  { title: 'Inception', year: 2010, rating: 8.8 },
  { title: 'The Dark Knight', year: 2008, rating: 9.0 },
]

describe('toCSV', () => {
  it('generates a header row followed by data rows', () => {
    const result = toCSV(rows, ['title', 'year', 'rating'])
    const lines = result.split('\n')
    expect(lines[0]).toBe('title,year,rating')
    expect(lines[1]).toBe('Inception,2010,8.8')
    expect(lines[2]).toBe('The Dark Knight,2008,9')
  })

  it('wraps fields containing commas in quotes', () => {
    const data = [{ title: 'One, Two, Three', year: 2000, rating: 7 }]
    const result = toCSV(data, ['title', 'year', 'rating'])
    expect(result).toContain('"One, Two, Three"')
  })

  it('escapes double-quotes by doubling them', () => {
    const data = [{ title: 'Say "Hello"', year: 2000, rating: 7 }]
    const result = toCSV(data, ['title', 'year', 'rating'])
    expect(result).toContain('"Say ""Hello"""')
  })

  it('outputs an empty string for null or undefined fields', () => {
    const data = [{ title: null as unknown as string, year: undefined as unknown as number, rating: 7 }]
    const result = toCSV(data, ['title', 'year', 'rating'])
    expect(result.split('\n')[1]).toBe(',,7')
  })

  it('returns only the header when rows array is empty', () => {
    const result = toCSV([], ['title', 'year'])
    expect(result).toBe('title,year\n')
  })

  it('exports only the specified fields in the given order', () => {
    const result = toCSV(rows, ['rating', 'title'])
    const lines = result.split('\n')
    expect(lines[0]).toBe('rating,title')
    expect(lines[1]).toBe('8.8,Inception')
  })

  it('uses custom headers when provided', () => {
    const result = toCSV(rows, ['title', 'year'], ['Título', 'Año'])
    const lines = result.split('\n')
    expect(lines[0]).toBe('Título,Año')
    expect(lines[1]).toBe('Inception,2010')
  })
})

describe('exportAsJSON', () => {
  let createObjectURL: jest.Mock
  let revokeObjectURL: jest.Mock
  let clickMock: jest.Mock

  beforeEach(() => {
    createObjectURL = jest.fn(() => 'blob:mock-url')
    revokeObjectURL = jest.fn()
    clickMock = jest.fn()
    global.URL.createObjectURL = createObjectURL
    global.URL.revokeObjectURL = revokeObjectURL
    jest.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickMock,
    } as unknown as HTMLAnchorElement)
  })

  afterEach(() => jest.restoreAllMocks())

  it('triggers a download with a .json filename', () => {
    exportAsJSON({ foo: 'bar' }, 'test.json')
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(clickMock).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})

describe('exportAsCSV', () => {
  let createObjectURL: jest.Mock
  let revokeObjectURL: jest.Mock
  let clickMock: jest.Mock

  beforeEach(() => {
    createObjectURL = jest.fn(() => 'blob:mock-url')
    revokeObjectURL = jest.fn()
    clickMock = jest.fn()
    global.URL.createObjectURL = createObjectURL
    global.URL.revokeObjectURL = revokeObjectURL
    jest.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: clickMock,
    } as unknown as HTMLAnchorElement)
  })

  afterEach(() => jest.restoreAllMocks())

  it('triggers a download with a .csv filename', () => {
    exportAsCSV(rows, ['title', 'year'], 'test.csv')
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
    expect(clickMock).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
