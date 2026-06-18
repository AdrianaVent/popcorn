import type { Rating } from '@/store/ratingsStore'

// Converts a TMDB 0–10 score to a 0.5–5 star rating (or null when unrated)
export function tmdbToStarRating(score: number): Rating | null {
  if (score <= 0) return null
  return Math.max(0.5, Math.round(score) / 2) as Rating
}

const THOUSAND_SEP: Record<string, string> = {
  es: '.',
}

// toLocaleString is intentionally avoided: Node.js ships without full ICU data by default,
// making numeric locale formatting unreliable across environments (e.g. 'es-ES' returns
// no separator in bare Node). The regex is deterministic regardless of runtime ICU support.
export function formatVoteCount(n: number, language: string): string {
  const sep = THOUSAND_SEP[language] ?? ','
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep)
}

export function formatRuntime(minutes: number, language = 'es'): string {
  const minUnit = language === 'es' ? 'min' : 'm'
  if (minutes < 60) return `${minutes} ${minUnit}`
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m === 0 ? `${h}h` : `${h}h ${m}${minUnit}`
  }
  const d = Math.floor(minutes / 1440)
  const h = Math.floor((minutes % 1440) / 60)
  return h === 0 ? `${d}d` : `${d}d ${h}h`
}
