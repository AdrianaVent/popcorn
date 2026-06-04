import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

// Provide TMDB API key so config.ts doesn't throw during tests
process.env.NEXT_PUBLIC_TMDB_API_KEY = 'test-key'
