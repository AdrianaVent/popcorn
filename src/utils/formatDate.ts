export function formatShortDate(dateStr: string, language: string): string {
  const date = new Date(dateStr)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = date.toLocaleDateString(language, { month: 'short' })
  const year = date.getUTCFullYear()
  return `${day} ${month} ${year}`
}
