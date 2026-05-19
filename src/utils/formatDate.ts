const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MONTHS_LONG_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_LONG_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export function formatShortDate(dateStr: string, language: string): string {
  const date = new Date(dateStr)
  const day = date.getUTCDate()
  const months = language === 'es' ? MONTHS_ES : MONTHS_EN
  const month = months[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  return language === 'es'
    ? `${String(day).padStart(2, '0')} ${month} ${year}`
    : `${month} ${day}, ${year}`
}

export function formatMonthYear(dateStr: string, language: string): string {
  const date = new Date(dateStr)
  const months = language === 'es' ? MONTHS_LONG_ES : MONTHS_LONG_EN
  const month = months[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  const s = language === 'es' ? `${month} de ${year}` : `${month} ${year}`
  return s.charAt(0).toUpperCase() + s.slice(1)
}
