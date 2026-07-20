export interface StoredSession {
  accessToken: string
  tenantId: string
  activeSppgId: string
  accessibleSppgIds: string[]
  roles: string[]
  userName: string
  email: string
}

const STORAGE_KEY = 'mbg-auth-session'

export const readStoredSession = (): StoredSession | null => {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

export const writeStoredSession = (session: StoredSession) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export const clearStoredSession = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}
