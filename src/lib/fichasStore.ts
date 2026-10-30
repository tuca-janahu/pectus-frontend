import type { FichaStatus } from '../components/ui'

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
const API_URL = import.meta.env?.VITE_API_URL ?? runtimeEnv?.VITE_API_URL ?? 'http://localhost:3000'

type ApiStatus = 'AGENDADA' | 'EM_PREENCHIMENTO' | 'CONCLUIDA' | 'CANCELADA'

interface ApiFicha {
  id: number
  ficha: FichaClinicalValues & { pacienteId: number; situacao: 'EM_TRATAMENTO' | 'FORA_DE_TRATAMENTO'; motivoEncerramento: 'ALTA' | 'ABANDONO' | 'OBITO' | null; dataEncerramento: string | null }
  medicoId: number
  dataHoraPrevista: string
  status: ApiStatus
  procedimento: string | null
  procedimentoOutro: string | null
  observacoes: string | null
  criadoEm: string
  historico: Array<{ tipo: string; em: string; autorContaId: number; campos: Record<string, unknown> }>
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
  procedimentoOutro: string
  status: FichaStatus
  descricao: string
  modo: 'previa' | 'ao-vivo'
  criadoEm: string
  statusApi: ApiStatus
  historico: ApiFicha['historico']
  situacao: 'EM_TRATAMENTO' | 'FORA_DE_TRATAMENTO'
  motivoEncerramento: 'ALTA' | 'ABANDONO' | 'OBITO' | null
  dataEncerramento: string | null
}

export interface FichaInput extends Partial<FichaClinicalValues> {
  pacienteId: number
  data: string
  hora: string
  procedimento: string
  procedimentoOutro?: string
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
    pacienteId: api.ficha.pacienteId,
    medicoId: api.medicoId,
    data,
    hora,
    procedimento: api.procedimento ?? 'Atendimento clínico',
    status: statusParaTela(api.status),
    procedimentoOutro: api.procedimentoOutro ?? '',
    descricao: api.observacoes ?? '',
    mecanismoLesao: api.ficha.mecanismoLesao ?? '',
    dataInjuriaTraqueal: api.ficha.dataInjuriaTraqueal?.slice(0, 10) ?? '',
    vocaliza: api.ficha.vocaliza,
    traqueostomizado: api.ficha.traqueostomizado,
    possuiComorbidades: api.ficha.possuiComorbidades,
    comorbidadesDescricao: api.ficha.comorbidadesDescricao ?? '',
    possuiSequelas: api.ficha.possuiSequelas,
    sequelasDescricao: api.ficha.sequelasDescricao ?? '',
    usaMedicamentos: api.ficha.usaMedicamentos,
    medicamentosDescricao: api.ficha.medicamentosDescricao ?? '',
    possuiLaringoscopia: api.ficha.possuiLaringoscopia,
    achadoLaringoscopia: api.ficha.achadoLaringoscopia ?? '',
    particularidades: api.ficha.particularidades ?? '',
    modo,
    criadoEm: api.criadoEm,
    statusApi: api.status,
    historico: api.historico ?? [],
    situacao: api.ficha.situacao,
    motivoEncerramento: api.ficha.motivoEncerramento,
    dataEncerramento: api.ficha.dataEncerramento,
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
  const { atendimentos } = await request<{ atendimentos: ApiFicha[] }>(accessToken, '/atendimentos')
  return atendimentos.map((atendimento) => paraFicha(atendimento))
}

export async function listProcedimentos(accessToken: string): Promise<Array<{ nome: string; descricao: string }>> {
  const { procedimentos } = await request<{ procedimentos: Array<{ nome: string; descricao: string }> }>(accessToken, '/procedimentos')
  return procedimentos
}

export async function listAtendimentosPaciente(accessToken: string, pacienteId: number): Promise<Ficha[]> {
  const { atendimentos } = await request<{ atendimentos: ApiFicha[] }>(accessToken, `/atendimentos?pacienteId=${pacienteId}`)
  return atendimentos.map((atendimento) => paraFicha(atendimento))
}

export interface FichaLongitudinal extends FichaClinicalValues {
  id: number
  pacienteId: number
  situacao: 'EM_TRATAMENTO' | 'FORA_DE_TRATAMENTO'
  motivoEncerramento: 'ALTA' | 'ABANDONO' | 'OBITO' | null
  dataEncerramento: string | null
}

export async function getFichaPaciente(accessToken: string, pacienteId: number): Promise<FichaLongitudinal> {
  const { ficha } = await request<{ ficha: FichaLongitudinal }>(accessToken, `/pacientes/${pacienteId}/ficha`)
  return ficha
}

export async function alterarSituacaoFicha(accessToken: string, atendimentoId: number, situacao: Ficha['situacao'], motivoEncerramento: Ficha['motivoEncerramento'], dataEncerramento: string | null): Promise<void> {
  await request(accessToken, `/atendimentos/${atendimentoId}/situacao`, {
    method: 'POST', body: JSON.stringify({ situacao, motivoEncerramento, dataEncerramento }),
  })
}

export async function createFicha(accessToken: string, medicoId: number, input: FichaInput): Promise<Ficha> {
  const iniciarAgora = input.status === 'pendente' || input.status === 'concluida'
  let { atendimento: ficha } = await request<{ atendimento: ApiFicha }>(accessToken, '/atendimentos', {
    method: 'POST',
    body: JSON.stringify({
      pacienteId: input.pacienteId,
      medicoId,
      dataHoraPrevista: dataHoraIso(input),
      procedimento: input.procedimento,
      procedimentoOutro: input.procedimento === 'Outro' ? input.procedimentoOutro : null,
      observacoes: input.descricao || null,
      iniciarAgora,
    }),
  })

  if (iniciarAgora && Object.keys(camposClinicosPayload(input)).length > 0) {
    ;({ atendimento: ficha } = await request<{ atendimento: ApiFicha }>(accessToken, `/atendimentos/${ficha.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        procedimento: input.procedimento,
        procedimentoOutro: input.procedimento === 'Outro' ? input.procedimentoOutro : null,
        observacoes: input.descricao || null,
        clinico: camposClinicosPayload(input),
      }),
    }))
  }

  if (input.status === 'concluida') {
    ;({ atendimento: ficha } = await request<{ atendimento: ApiFicha }>(accessToken, `/atendimentos/${ficha.id}/concluir`, {
      method: 'POST',
    }))
  } else if (input.status === 'cancelada') {
    ;({ atendimento: ficha } = await request<{ atendimento: ApiFicha }>(accessToken, `/atendimentos/${ficha.id}/cancelar`, {
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
  let { atendimento: ficha } = await request<{ atendimento: ApiFicha }>(accessToken, `/atendimentos/${id}`)
  if (ficha.status === 'CONCLUIDA') {
    ;({ atendimento: ficha } = await request<{ atendimento: ApiFicha }>(accessToken, `/atendimentos/${id}/corrigir`, {
      method: 'POST',
      body: JSON.stringify({
        procedimento: input.procedimento,
        procedimentoOutro: input.procedimento === 'Outro' ? input.procedimentoOutro : null,
        observacoes: input.descricao || null,
        clinico: camposClinicosPayload(input),
      }),
    }))
    return paraFicha(ficha, input.modo)
  }
  if (ficha.status === 'CANCELADA') {
    throw new Error('Fichas concluídas ou canceladas não podem ser alteradas.')
  }

  if (input.status === 'cancelada') {
    ;({ atendimento: ficha } = await request<{ atendimento: ApiFicha }>(accessToken, `/atendimentos/${id}/cancelar`, {
      method: 'POST',
    }))
    return paraFicha(ficha, input.modo)
  }

  if (ficha.status === 'AGENDADA') {
    ;({ atendimento: ficha } = await request<{ atendimento: ApiFicha }>(accessToken, `/atendimentos/${id}/agendamento`, {
      method: 'PATCH',
      body: JSON.stringify({
        medicoId,
        dataHoraPrevista: dataHoraIso(input),
        procedimento: input.procedimento,
        procedimentoOutro: input.procedimento === 'Outro' ? input.procedimentoOutro : null,
        observacoes: input.descricao || null,
      }),
    }))
    if (input.status === 'agendada') return paraFicha(ficha, input.modo)
    ;({ atendimento: ficha } = await request<{ atendimento: ApiFicha }>(accessToken, `/atendimentos/${id}/iniciar`, {
      method: 'POST',
    }))
  } else if (input.status === 'agendada') {
    throw new Error('Uma ficha iniciada não pode voltar para agendada.')
  }

  ;({ atendimento: ficha } = await request<{ atendimento: ApiFicha }>(accessToken, `/atendimentos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      procedimento: input.procedimento,
      procedimentoOutro: input.procedimento === 'Outro' ? input.procedimentoOutro : null,
      observacoes: input.descricao || null,
      clinico: camposClinicosPayload(input),
    }),
  }))

  if (input.status === 'concluida') {
    ;({ atendimento: ficha } = await request<{ atendimento: ApiFicha }>(accessToken, `/atendimentos/${id}/concluir`, {
      method: 'POST',
    }))
  }
  return paraFicha(ficha, input.modo)
}

export async function deleteFicha(accessToken: string, id: number): Promise<void> {
  await request(accessToken, `/atendimentos/${id}/cancelar`, { method: 'POST' })
}

export interface MidiaAtendimento {
  id: number
  atendimentoId: number
  nomeOriginal: string
  mimeType: string
  tamanhoBytes: number
  url: string
}

export async function listMidias(accessToken: string, atendimentoId: number): Promise<MidiaAtendimento[]> {
  const { midias } = await request<{ midias: MidiaAtendimento[] }>(accessToken, `/atendimentos/${atendimentoId}/midias`)
  return midias
}

export async function uploadMidia(accessToken: string, atendimentoId: number, arquivo: File): Promise<MidiaAtendimento> {
  const formData = new FormData()
  formData.append('arquivo', arquivo)
  const response = await fetch(`${API_URL}/atendimentos/${atendimentoId}/midias`, {
    method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: formData,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error ?? 'Falha ao enviar mídia')
  return body.midia as MidiaAtendimento
}

export async function removerMidia(accessToken: string, atendimentoId: number, midiaId: number): Promise<void> {
  const response = await fetch(`${API_URL}/atendimentos/${atendimentoId}/midias/${midiaId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body?.error ?? 'Falha ao remover mídia')
  }
}
