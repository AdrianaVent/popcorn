import { parseJSON, parseCSV } from './importUtils'

describe('parseJSON', () => {
  it('parses a valid JSON array', () => {
    const result = parseJSON('[{"username":"alice","role":"guest"}]')
    expect(result).toEqual([{ username: 'alice', role: 'guest' }])
  })

  it('throws when JSON is not an array', () => {
    expect(() => parseJSON('{"not":"array"}')).toThrow()
  })

  it('throws when JSON is malformed', () => {
    expect(() => parseJSON('not json {')).toThrow()
  })
})

describe('parseCSV', () => {
  it('parses a simple 3-column CSV', () => {
    const csv = 'username,password,role\nalice,Alice1!x,guest\nbob,Bob12!x,admin'
    expect(parseCSV(csv)).toEqual([
      { username: 'alice', password: 'Alice1!x', role: 'guest' },
      { username: 'bob', password: 'Bob12!x', role: 'admin' },
    ])
  })

  it('returns empty array when CSV has only a header row', () => {
    expect(parseCSV('username,password,role')).toEqual([])
  })

  it('returns empty array for empty/blank input', () => {
    expect(parseCSV('')).toEqual([])
  })

  it('handles commas inside the password column (3-column CSV)', () => {
    const csv = 'username,password,role\nalice,Pass,word1!,guest'
    expect(parseCSV(csv)).toEqual([{ username: 'alice', password: 'Pass,word1!', role: 'guest' }])
  })

  it('parses a 5-column CSV with created_by and created_at', () => {
    const csv = 'username,password,role,created_by,created_at\nalice,Alice1!x,guest,admin,2024-01-01'
    expect(parseCSV(csv)).toEqual([
      { username: 'alice', password: 'Alice1!x', role: 'guest', created_by: 'admin', created_at: '2024-01-01' },
    ])
  })

  it('handles commas inside the password column in a 5-column CSV', () => {
    const csv = 'username,password,role,created_by,created_at\nalice,Pass,word1!,guest,admin,2024-01-01'
    expect(parseCSV(csv)).toEqual([
      { username: 'alice', password: 'Pass,word1!', role: 'guest', created_by: 'admin', created_at: '2024-01-01' },
    ])
  })

  it('trims whitespace from headers and values', () => {
    const csv = ' username , password , role \n alice , Alice1!x , guest '
    expect(parseCSV(csv)).toEqual([{ username: 'alice', password: 'Alice1!x', role: 'guest' }])
  })
})
