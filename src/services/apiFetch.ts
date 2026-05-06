async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' })
    return res.ok
  } catch {
    return false
  }
}

export function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.replace('/login')
  }
}

// Central fetch wrapper for internal API routes.
// On 401: tries to silently refresh the session and retries once.
// If refresh also fails, redirects to /login and throws to stop execution.
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  let res = await fetch(url, options)

  if (res.status === 401) {
    const refreshed = await attemptRefresh()
    if (refreshed) {
      res = await fetch(url, options)
    } else {
      redirectToLogin()
      throw new Error('SESSION_EXPIRED')
    }
  }

  return res
}
