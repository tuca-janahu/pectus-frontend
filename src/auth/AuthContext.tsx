import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from '../lib/api'
import type { AuthUser } from '../lib/api'
import { clearTokens, loadTokens, saveTokens, wasRemembered, type Tokens } from './tokenStorage'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  accessToken: string | null
  login: (email: string, password: string, remember: boolean) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function resolveUser(tokens: Tokens): Promise<{ user: AuthUser; accessToken: string } | null> {
  try {
    const user = await api.me(tokens.accessToken)
    return { user, accessToken: tokens.accessToken }
  } catch {
    try {
      const refreshed = await api.refresh(tokens.refreshToken)
      saveTokens(refreshed, wasRemembered())
      return { user: refreshed.conta, accessToken: refreshed.accessToken }
    } catch {
      return null
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const tokens = loadTokens()
    if (!tokens) {
      setStatus('unauthenticated')
      return
    }
    resolveUser(tokens).then((resolved) => {
      if (resolved) {
        setUser(resolved.user)
        setAccessToken(resolved.accessToken)
        setStatus('authenticated')
      } else {
        clearTokens()
        setStatus('unauthenticated')
      }
    })
  }, [])

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const session = await api.login(email, password)
    saveTokens(session, remember)
    setUser(session.conta)
    setAccessToken(session.accessToken)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(() => {
    const tokens = loadTokens()
    if (tokens) api.logout(tokens.refreshToken).catch(() => {})
    clearTokens()
    setUser(null)
    setAccessToken(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(
    () => ({ status, user, accessToken, login, logout }),
    [status, user, accessToken, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
