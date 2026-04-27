export const TOKEN_MAX_TIME = 60 * 60
export const REFRESH_TOKEN_MAX_TIME = 60 * 60 * 24 * 7
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
export const JWT_SECRET_BYTES = new TextEncoder().encode(JWT_SECRET)
