type LoginPayload = {
  email: string
  password: string
}

type LoginResult = {
  code: string
  ok: boolean
  userId?: string
  role?: 'admin' | 'guest'
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: payload.email, password: payload.password }),
  })
  try {
    const data = await res.json()
    return { code: data.code ?? 'LOGIN_FAILED', ok: res.ok, userId: data.userId, role: data.role }
  } catch {
    return { code: 'LOGIN_FAILED', ok: false }
  }
}
