export const DEFAULT_LANGUAGE = 'es-ES'

// Languages supported by the app — TMDB search doesn't respect with_original_language,
// so this is applied client-side to filter out results in other languages.
export const ALLOWED_ORIGINAL_LANGUAGES = new Set(['en', 'es'])
