import { DUMMYJSON_LOGIN_URL } from '@/config/auth'

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
}
