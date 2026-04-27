function escapeCSVField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  fields: (keyof T)[],
  headers?: string[],
): string {
  const header = (headers ?? fields.map(String)).join(',')
  const body = rows
    .map((row) => fields.map((f) => escapeCSVField(row[f] as string | number | null)).join(','))
    .join('\n')
  return `${header}\n${body}`
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportAsJSON(data: unknown, filename: string): void {
  downloadBlob(JSON.stringify(data, null, 2), filename, 'application/json')
}

export function exportAsCSV<T extends Record<string, unknown>>(
  rows: T[],
  fields: (keyof T)[],
  filename: string,
  headers?: string[],
): void {
  downloadBlob(toCSV(rows, fields, headers), filename, 'text/csv;charset=utf-8;')
}
