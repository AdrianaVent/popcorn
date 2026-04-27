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
