import { DUMMYJSON_LOGIN_URL, DUMMYJSON_REFRESH_URL } from '@/services/auth/config'

type LoginResponse = {
  accessToken: string
  refreshToken: string
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  image: string
}

type RefreshResponse = {
  accessToken: string
  refreshToken: string
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(DUMMYJSON_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, expiresInMins: 60 }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message ?? 'Invalid credentials')
    }

    return res.json()
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await fetch(DUMMYJSON_REFRESH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken, expiresInMins: 60 }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message ?? 'Session expired')
    }

    return res.json()
  },
}
