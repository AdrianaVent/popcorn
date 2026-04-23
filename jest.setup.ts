import '@testing-library/jest-dom'

// Provide TMDB API key so config.ts doesn't throw during tests
process.env.NEXT_PUBLIC_TMDB_API_KEY = 'test-key'
