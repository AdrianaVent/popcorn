import { getTMDBImageUrl } from './tmdb'

describe('getTMDBImageUrl', () => {
  it('returns null when path is null', () => {
    expect(getTMDBImageUrl(null)).toBeNull()
  })

  it('returns null when path is empty string', () => {
    expect(getTMDBImageUrl('')).toBeNull()
  })

  it('builds a URL with the default size (w500)', () => {
    const url = getTMDBImageUrl('/poster.jpg')
    expect(url).toBe('https://image.tmdb.org/t/p/w500/poster.jpg')
  })

  it('builds a URL with a custom size', () => {
    expect(getTMDBImageUrl('/poster.jpg', 'w342')).toBe(
      'https://image.tmdb.org/t/p/w342/poster.jpg'
    )
  })

  it('works with original size', () => {
    expect(getTMDBImageUrl('/poster.jpg', 'original')).toBe(
      'https://image.tmdb.org/t/p/original/poster.jpg'
    )
  })
})
