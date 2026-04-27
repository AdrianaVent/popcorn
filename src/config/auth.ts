export const TOKEN_MAX_TIME = 60 * 60
export const REFRESH_TOKEN_MAX_TIME = 60 * 60 * 24 * 7
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
// Encoded once at module load and shared between middleware (Edge Runtime) and
// authService (Node.js). TextEncoder is available in both runtimes.
export const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET)
