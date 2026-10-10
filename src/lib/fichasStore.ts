import type { FichaStatus } from '../components/ui'

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
const API_URL = import.meta.env?.VITE_API_URL ?? runtimeEnv?.VITE_API_URL ?? 'http://localhost:3000'

type ApiStatus = 'AGENDADA' | 'EM_PREENCHIMENTO' | 'CONCLUIDA' | 'CANCELADA'

interface ApiFicha {
  id: number
  pacienteId: number
  medicoId: number
  dataHoraPrevista: string
  status: ApiStatus
  procedimento: string | null
  observacoes: string | null
  mecanismoLesao: string | null
  dataInjuriaTraqueal: string | null
  vocaliza: boolean
  traqueostomizado: boolean
  possuiComorbidades: boolean
  comorbidadesDescricao: string | null
  possuiSequelas: boolean
  sequelasDescricao: string | null
  usaMedicamentos: boolean
  medicamentosDescricao: string | null
  possuiLaringoscopia: boolean
  achadoLaringoscopia: string | null
  particularidades: string | null
  criadoEm: string
}

export interface FichaClinicalValues {
  mecanismoLesao: string
  dataInjuriaTraqueal: string
  vocaliza: boolean
  traqueostomizado: boolean
  possuiComorbidades: boolean
  comorbidadesDescricao: string
  possuiSequelas: boolean
  sequelasDescricao: string
  usaMedicamentos: boolean
  medicamentosDescricao: string
  possuiLaringoscopia: boolean
  achadoLaringoscopia: string
  particularidades: string
}

export const EMPTY_CLINICAL_VALUES: FichaClinicalValues = {
  mecanismoLesao: '',
  dataInjuriaTraqueal: '',
  vocaliza: false,
  traqueostomizado: false,
  possuiComorbidades: false,
  comorbidadesDescricao: '',
  possuiSequelas: false,
  sequelasDescricao: '',
  usaMedicamentos: false,
  medicamentosDescricao: '',
  possuiLaringoscopia: false,
  achadoLaringoscopia: '',
  particularidades: '',
}

export function clinicalValuesFromFicha(ficha: FichaClinicalValues): FichaClinicalValues {
  return {
    mecanismoLesao: ficha.mecanismoLesao,
    dataInjuriaTraqueal: ficha.dataInjuriaTraqueal,
    vocaliza: ficha.vocaliza,
    traqueostomizado: ficha.traqueostomizado,
    possuiComorbidades: ficha.possuiComorbidades,
    comorbidadesDescricao: ficha.comorbidadesDescricao,
    possuiSequelas: ficha.possuiSequelas,
    sequelasDescricao: ficha.sequelasDescricao,
    usaMedicamentos: ficha.usaMedicamentos,
    medicamentosDescricao: ficha.medicamentosDescricao,
    possuiLaringoscopia: ficha.possuiLaringoscopia,
    achadoLaringoscopia: ficha.achadoLaringoscopia,
    particularidades: ficha.particularidades,
  }
}

export interface Ficha extends FichaClinicalValues {
  id: number
  pacienteId: number
  medicoId: number
  data: string
  hora: string
  procedimento: string
  status: FichaStatus
  descricao: string
  modo: 'previa' | 'ao-vivo'
  criadoEm: string
  statusApi: ApiStatus
}

export interface FichaInput extends Partial<FichaClinicalValues> {
  pacienteId: number
  data: string
  hora: string
  procedimento: string
  status: FichaStatus
  descricao: string
  modo?: 'previa' | 'ao-vivo'
}

async function request<T>(accessToken: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error ?? 'Erro inesperado ao acessar as fichas.')
  return body as T
}

function statusParaTela(status: ApiStatus): FichaStatus {
  if (status === 'EM_PREENCHIMENTO') return 'pendente'
  return status.toLowerCase() as FichaStatus
}

function paraFicha(api: ApiFicha, modo: Ficha['modo'] = 'previa'): Ficha {
  const dataHora = new Date(api.dataHoraPrevista)
  const data = `${dataHora.getFullYear()}-${String(dataHora.getMonth() + 1).padStart(2, '0')}-${String(dataHora.getDate()).padStart(2, '0')}`
  const hora = `${String(dataHora.getHours()).padStart(2, '0')}:${String(dataHora.getMinutes()).padStart(2, '0')}`
  return {
    id: api.id,
    pacienteId: api.pacienteId,
    medicoId: api.medicoId,
    data,
    hora,
    procedimento: api.procedimento ?? 'Atendimento clínico',
    status: statusParaTela(api.status),
    descricao: api.observacoes ?? '',
    mecanismoLesao: api.mecanismoLesao ?? '',
    dataInjuriaTraqueal: api.dataInjuriaTraqueal?.slice(0, 10) ?? '',
    vocaliza: api.vocaliza,
    traqueostomizado: api.traqueostomizado,
    possuiComorbidades: api.possuiComorbidades,
    comorbidadesDescricao: api.comorbidadesDescricao ?? '',
    possuiSequelas: api.possuiSequelas,
    sequelasDescricao: api.sequelasDescricao ?? '',
    usaMedicamentos: api.usaMedicamentos,
    medicamentosDescricao: api.medicamentosDescricao ?? '',
    possuiLaringoscopia: api.possuiLaringoscopia,
    achadoLaringoscopia: api.achadoLaringoscopia ?? '',
    particularidades: api.particularidades ?? '',
    modo,
    criadoEm: api.criadoEm,
    statusApi: api.status,
  }
}

function dataHoraIso(input: FichaInput): string {
  return new Date(`${input.data}T${input.hora || '00:00'}:00`).toISOString()
}

function camposClinicosPayload(input: FichaInput): Record<string, string | boolean | null> {
  const payload: Record<string, string | boolean | null> = {}
  const textFields = [
    'mecanismoLesao',
    'dataInjuriaTraqueal',
    'comorbidadesDescricao',
    'sequelasDescricao',
    'medicamentosDescricao',
    'achadoLaringoscopia',
    'particularidades',
  ] as const
  const booleanFields = [
    'vocaliza',
    'traqueostomizado',
    'possuiComorbidades',
    'possuiSequelas',
    'usaMedicamentos',
    'possuiLaringoscopia',
  ] as const
  for (const field of textFields) {
    if (input[field] !== undefined) payload[field] = input[field] || null
  }
  for (const field of booleanFields) {
    if (input[field] !== undefined) payload[field] = input[field]
  }
  return payload
}

export async function listFichas(accessToken: string): Promise<Ficha[]> {
  const { fichas } = await request<{ fichas: ApiFicha[] }>(accessToken, '/fichas-epicriticas')
  return fichas.map((ficha) => paraFicha(ficha))
}

export async function createFicha(accessToken: string, medicoId: number, input: FichaInput): Promise<Ficha> {
  const iniciarAgora = input.status === 'pendente' || input.status === 'concluida'
  let { ficha } = await request<{ ficha: ApiFicha }>(accessToken, '/fichas-epicriticas', {
    method: 'POST',
    body: JSON.stringify({
      pacienteId: input.pacienteId,
      medicoId,
      dataHoraPrevista: dataHoraIso(input),
      procedimento: input.procedimento,
      observacoes: input.descricao || null,
      iniciarAgora,
    }),
  })

  if (iniciarAgora && Object.keys(camposClinicosPayload(input)).length > 0) {
    ;({ ficha } = await request<{ ficha: ApiFicha }>(accessToken, `/fichas-epicriticas/${ficha.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        procedimento: input.procedimento,
        observacoes: input.descricao || null,
        ...camposClinicosPayload(input),
      }),
    }))
  }

  if (input.status === 'concluida') {
    ;({ ficha } = await request<{ ficha: ApiFicha }>(accessToken, `/fichas-epicriticas/${ficha.id}/concluir`, {
      method: 'POST',
    }))
  } else if (input.status === 'cancelada') {
    ;({ ficha } = await request<{ ficha: ApiFicha }>(accessToken, `/fichas-epicriticas/${ficha.id}/cancelar`, {
      method: 'POST',
    }))
  }

  return paraFicha(ficha, input.modo)
}

export async function updateFicha(
  accessToken: string,
  medicoId: number,
  id: number,
  input: FichaInput,
): Promise<Ficha> {
  let { ficha } = await request<{ ficha: ApiFicha }>(accessToken, `/fichas-epicriticas/${id}`)
  if (ficha.status === 'CONCLUIDA' || ficha.status === 'CANCELADA') {
    throw new Error('Fichas concluídas ou canceladas não podem ser alteradas.')
  }

  if (input.status === 'cancelada') {
    ;({ ficha } = await request<{ ficha: ApiFicha }>(accessToken, `/fichas-epicriticas/${id}/cancelar`, {
      method: 'POST',
    }))
    return paraFicha(ficha, input.modo)
  }

  if (ficha.status === 'AGENDADA') {
    ;({ ficha } = await request<{ ficha: ApiFicha }>(accessToken, `/fichas-epicriticas/${id}/agendamento`, {
      method: 'PATCH',
      body: JSON.stringify({
        medicoId,
        dataHoraPrevista: dataHoraIso(input),
        procedimento: input.procedimento,
        observacoes: input.descricao || null,
      }),
    }))
    if (input.status === 'agendada') return paraFicha(ficha, input.modo)
    ;({ ficha } = await request<{ ficha: ApiFicha }>(accessToken, `/fichas-epicriticas/${id}/iniciar`, {
      method: 'POST',
    }))
  } else if (input.status === 'agendada') {
    throw new Error('Uma ficha iniciada não pode voltar para agendada.')
  }

  ;({ ficha } = await request<{ ficha: ApiFicha }>(accessToken, `/fichas-epicriticas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      procedimento: input.procedimento,
      observacoes: input.descricao || null,
      ...camposClinicosPayload(input),
    }),
  }))

  if (input.status === 'concluida') {
    ;({ ficha } = await request<{ ficha: ApiFicha }>(accessToken, `/fichas-epicriticas/${id}/concluir`, {
      method: 'POST',
    }))
  }
  return paraFicha(ficha, input.modo)
}

export async function deleteFicha(accessToken: string, id: number): Promise<void> {
  await request(accessToken, `/fichas-epicriticas/${id}/cancelar`, { method: 'POST' })
}
