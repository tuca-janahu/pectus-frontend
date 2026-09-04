export interface Tokens {
  accessToken: string
  refreshToken: string
}

const ACCESS_KEY = 'tm-access-token'
const REFRESH_KEY = 'tm-refresh-token'

export function saveTokens(tokens: Tokens, remember: boolean): void {
  clearTokens()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(ACCESS_KEY, tokens.accessToken)
  storage.setItem(REFRESH_KEY, tokens.refreshToken)
}

export function loadTokens(): Tokens | null {
  const accessToken = localStorage.getItem(ACCESS_KEY) ?? sessionStorage.getItem(ACCESS_KEY)
  const refreshToken = localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY)
  if (!accessToken || !refreshToken) return null
  return { accessToken, refreshToken }
}

/** Whether the tokens currently in storage were saved with "remember me" (localStorage vs sessionStorage). */
export function wasRemembered(): boolean {
  return localStorage.getItem(ACCESS_KEY) !== null
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  sessionStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
}
