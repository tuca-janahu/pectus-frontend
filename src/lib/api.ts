const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

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
  return fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((res) => parseJsonOrThrow<AuthSession>(res))
}

export function loginWithGoogle(code: string): Promise<AuthSession> {
  return fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  }).then((res) => parseJsonOrThrow<AuthSession>(res))
}

export function me(accessToken: string): Promise<AuthUser> {
  return fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((res) => parseJsonOrThrow<AuthUser>(res))
}

export function refresh(refreshToken: string): Promise<AuthSession> {
  return fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).then((res) => parseJsonOrThrow<AuthSession>(res))
}

export async function logout(refreshToken: string): Promise<void> {
  await fetch(`${API_URL}/auth/logout`, {
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
  return fetch(`${API_URL}/contas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  }).then((res) => parseJsonOrThrow<CreateAccountResult>(res))
}

export interface ContaResumo {
  id: number
  nome: string
  email: string
  papeis: { papel: Papel }[]
  medico: { id: number; crm: string } | null
  inativadoEm: string | null
  ativada: boolean
  criadoEm: string
}

export function listAccounts(accessToken: string): Promise<{ contas: ContaResumo[] }> {
  return fetch(`${API_URL}/contas`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((res) => parseJsonOrThrow<{ contas: ContaResumo[] }>(res))
}

export interface UpdateAccountInput {
  nome?: string
  roles?: Papel[]
  crm?: string
  ativo?: boolean
}

export function updateAccount(
  accessToken: string,
  id: number,
  input: UpdateAccountInput,
): Promise<{ conta: ContaResumo }> {
  return fetch(`${API_URL}/contas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(input),
  }).then((res) => parseJsonOrThrow<{ conta: ContaResumo }>(res))
}

export async function activate(token: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error ?? 'Erro inesperado')
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error ?? 'Erro inesperado')
  }
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error ?? 'Erro inesperado')
  }
}

export type ModuloAuditoria = 'AUTENTICACAO' | 'USUARIOS' | 'PACIENTES'

export interface LogResumo {
  id: number
  modulo: ModuloAuditoria
  tipo: string
  descricao: string
  atorId: number | null
  ator: { id: number; nome: string; email: string } | null
  metadata: unknown
  criadoEm: string
}

export interface ListLogsFiltro {
  de?: string
  ate?: string
  modulo?: ModuloAuditoria
  busca?: string
  offset?: number
}

function buildQuery(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export function listLogs(
  accessToken: string,
  filtro: ListLogsFiltro = {},
): Promise<{ items: LogResumo[]; total: number }> {
  const query = buildQuery({
    de: filtro.de,
    ate: filtro.ate,
    modulo: filtro.modulo,
    busca: filtro.busca,
    offset: filtro.offset ? String(filtro.offset) : undefined,
  })
  return fetch(`${API_URL}/logs${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((res) => parseJsonOrThrow<{ items: LogResumo[]; total: number }>(res))
}
