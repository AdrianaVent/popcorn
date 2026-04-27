const THOUSAND_SEP: Record<string, string> = {
  es: '.',
}

export function formatVoteCount(n: number, language: string): string {
  const sep = THOUSAND_SEP[language] ?? ','
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, sep)
}
