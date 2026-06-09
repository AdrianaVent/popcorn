import type { ImportRow } from '@/components/common/ImportModal'

export function parseJSON(content: string): ImportRow[] {
  const data = JSON.parse(content)
  if (!Array.isArray(data)) throw new Error()
  return data
}

export function parseCSV(content: string): ImportRow[] {
  const lines = content.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = (lines[0] ?? '').split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const parts = line.split(',')
    const row: ImportRow = {}
    // password (index 1) may contain commas — consume exactly `trailingColumns`
    // parts from the end for the trailing headers, everything in between is the password
    if (parts.length > headers.length && headers.length >= 2) {
      const excess = parts.length - headers.length
      row[headers[0]!] = (parts[0] ?? '').trim()
      row[headers[1]!] = parts.slice(1, 1 + excess + 1).join(',').trim()
      for (let i = 2; i < headers.length; i++) row[headers[i]!] = (parts[i + excess] ?? '').trim()
    } else {
      headers.forEach((h, i) => { row[h] = (parts[i] ?? '').trim() })
    }
    return row
  })
}
