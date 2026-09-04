export interface AuthUser {
  id: number
  email: string
  nome: string
  roles: string[]
  medico: { crm: string } | null
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  conta: AuthUser
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? 'Erro inesperado')
  }
  return body as T
}

export function login(email: string, password: string): Promise<AuthSession> {
  return fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((res) => parseJsonOrThrow<AuthSession>(res))
}

export function me(accessToken: string): Promise<AuthUser> {
  return fetch('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((res) => parseJsonOrThrow<AuthUser>(res))
}

export function refresh(refreshToken: string): Promise<AuthSession> {
  return fetch('/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).then((res) => parseJsonOrThrow<AuthSession>(res))
}

export async function logout(refreshToken: string): Promise<void> {
  await fetch('/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
}

export type Papel = 'ADMIN' | 'MEDICO'

export interface CreateAccountInput {
  nome: string
  email: string
  roles: Papel[]
  medico?: { crm: string }
}

export interface CreateAccountResult {
  conta: {
    id: number
    nome: string
    email: string
    papeis: { papel: Papel }[]
    medico: { id: number; crm: string } | null
  }
  activationToken: string
  activationExpiresAt: string
}

export function createAccount(accessToken: string, input: CreateAccountInput): Promise<CreateAccountResult> {
  return fetch('/contas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  }).then((res) => parseJsonOrThrow<CreateAccountResult>(res))
}

export async function activate(token: string, password: string): Promise<void> {
  const res = await fetch('/auth/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error ?? 'Erro inesperado')
  }
}
