// Camada mock para Fichas — não há rotas de backend para fichas ainda.
// Este módulo é o ponto de troca único: quando as rotas forem criadas,
// substitua as implementações abaixo por chamadas fetch (como em lib/api.ts)
// mantendo as mesmas assinaturas, e nenhum componente precisa mudar.
import type { FichaStatus } from '../components/ui'

const STORAGE_KEY = 'tm-fichas-mock'

export interface Ficha {
  id: number
  pacienteId: number
  data: string // YYYY-MM-DD
  hora: string // HH:MM
  procedimento: string
  status: FichaStatus
  descricao: string
  modo: 'previa' | 'ao-vivo'
  criadoEm: string
}

export interface FichaInput {
  pacienteId: number
  data: string
  hora: string
  procedimento: string
  status: FichaStatus
  descricao: string
  modo?: 'previa' | 'ao-vivo'
}

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function readAll(): Ficha[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Ficha[]
  } catch {
    return []
  }
}

function writeAll(fichas: Ficha[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fichas))
}

let nextId = 1

function ensureNextId(fichas: Ficha[]) {
  nextId = fichas.reduce((max, f) => Math.max(max, f.id + 1), nextId)
}

export async function listFichas(): Promise<Ficha[]> {
  const fichas = readAll()
  ensureNextId(fichas)
  return delay(fichas)
}

export async function createFicha(input: FichaInput): Promise<Ficha> {
  const fichas = readAll()
  ensureNextId(fichas)
  const ficha: Ficha = {
    id: nextId++,
    modo: 'previa',
    ...input,
    criadoEm: new Date().toISOString(),
  }
  writeAll([...fichas, ficha])
  return delay(ficha)
}

export async function updateFicha(id: number, input: FichaInput): Promise<Ficha> {
  const fichas = readAll()
  const existing = fichas.find((f) => f.id === id)
  if (!existing) throw new Error('Ficha não encontrada.')
  const atualizada: Ficha = { ...existing, ...input, modo: input.modo ?? existing.modo }
  writeAll(fichas.map((f) => (f.id === id ? atualizada : f)))
  return delay(atualizada)
}

export async function deleteFicha(id: number): Promise<void> {
  const fichas = readAll()
  writeAll(fichas.filter((f) => f.id !== id))
  return delay(undefined)
}
