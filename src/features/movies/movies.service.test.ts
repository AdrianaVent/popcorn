import { fetchMovies } from './movies.service'
import { moviesService } from '@/services/tmdb/movies'

jest.mock('@/services/tmdb/movies', () => ({
  moviesService: {
    search:     jest.fn(),
    discover:   jest.fn(),
    nowPlaying: jest.fn(),
  },
}))

const mockNowPlaying = moviesService.nowPlaying as jest.MockedFunction<typeof moviesService.nowPlaying>
const mockDiscover   = moviesService.discover   as jest.MockedFunction<typeof moviesService.discover>

const emptyPage = { results: [], page: 1, total_pages: 1, total_results: 0 }

beforeEach(() => {
  jest.clearAllMocks()
  mockDiscover.mockResolvedValue(emptyPage)
  mockNowPlaying.mockResolvedValue(emptyPage)
})

describe('fetchMovies — in_theaters filter', () => {
  it('calls nowPlaying when in_theaters is true', async () => {
    await fetchMovies(1, 'es', { in_theaters: true })
    expect(mockNowPlaying).toHaveBeenCalledTimes(1)
    expect(mockDiscover).not.toHaveBeenCalled()
  })

  it('calls discover when in_theaters is false', async () => {
    await fetchMovies(1, 'es', { in_theaters: false })
    expect(mockDiscover).toHaveBeenCalled()
    expect(mockNowPlaying).not.toHaveBeenCalled()
  })

  it('calls discover when in_theaters is absent', async () => {
    await fetchMovies(1, 'es', {})
    expect(mockDiscover).toHaveBeenCalled()
    expect(mockNowPlaying).not.toHaveBeenCalled()
  })

  it('passes correct language to nowPlaying', async () => {
    await fetchMovies(1, 'es', { in_theaters: true })
    expect(mockNowPlaying).toHaveBeenCalledWith(1, 'es-ES')
  })
})
