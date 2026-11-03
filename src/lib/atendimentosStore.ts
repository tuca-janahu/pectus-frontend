import type { AtendimentoStatus } from '../components/ui'

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
const API_URL = import.meta.env?.VITE_API_URL ?? runtimeEnv?.VITE_API_URL ?? 'http://localhost:3000'

type ApiStatus = 'AGENDADA' | 'EM_PREENCHIMENTO' | 'CONCLUIDA' | 'CANCELADA'

interface ApiAtendimento {
  id: number
  ficha: FichaClinicalValues & { pacienteId: number; situacao: 'EM_TRATAMENTO' | 'FORA_DE_TRATAMENTO'; motivoEncerramento: 'ALTA' | 'ABANDONO' | 'OBITO' | null; dataEncerramento: string | null }
  medicoId: number
  dataHoraPrevista: string
  status: ApiStatus
  procedimento: string | null
  procedimentoOutro: string | null
  observacoes: string | null
  criadoEm: string
  historico: Array<{ tipo: string; em: string; autorContaId: number; autorEmail?: string | null; campos: Record<string, unknown> }>
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

export interface Atendimento extends FichaClinicalValues {
  id: number
  pacienteId: number
  medicoId: number
  data: string
  hora: string
  procedimento: string
  procedimentoOutro: string
  status: AtendimentoStatus
  descricao: string
  criadoEm: string
  statusApi: ApiStatus
  historico: ApiAtendimento['historico']
  situacao: 'EM_TRATAMENTO' | 'FORA_DE_TRATAMENTO'
  motivoEncerramento: 'ALTA' | 'ABANDONO' | 'OBITO' | null
  dataEncerramento: string | null
}

export interface AtendimentoInput extends Partial<FichaClinicalValues> {
  pacienteId: number
  data: string
  hora: string
  procedimento: string
  procedimentoOutro?: string
  status: AtendimentoStatus
  descricao: string
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
  if (!response.ok) throw new Error(body?.error ?? 'Erro inesperado ao acessar os atendimentos.')
  return body as T
}

function statusParaTela(status: ApiStatus): AtendimentoStatus {
  if (status === 'EM_PREENCHIMENTO') return 'pendente'
  return status.toLowerCase() as AtendimentoStatus
}

function paraAtendimento(api: ApiAtendimento): Atendimento {
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
    criadoEm: api.criadoEm,
    statusApi: api.status,
    historico: api.historico ?? [],
    situacao: api.ficha.situacao,
    motivoEncerramento: api.ficha.motivoEncerramento,
    dataEncerramento: api.ficha.dataEncerramento,
  }
}

function dataHoraIso(input: AtendimentoInput): string {
  return new Date(`${input.data}T${input.hora || '00:00'}:00`).toISOString()
}

function camposClinicosPayload(input: AtendimentoInput): Record<string, string | boolean | null> {
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

export async function listAtendimentos(accessToken: string): Promise<Atendimento[]> {
  const { atendimentos } = await request<{ atendimentos: ApiAtendimento[] }>(accessToken, '/atendimentos')
  return atendimentos.map((atendimento) => paraAtendimento(atendimento))
}

export async function listProcedimentos(accessToken: string): Promise<Array<{ nome: string; descricao: string }>> {
  const { procedimentos } = await request<{ procedimentos: Array<{ nome: string; descricao: string }> }>(accessToken, '/procedimentos')
  return procedimentos
}

export async function listAtendimentosPaciente(accessToken: string, pacienteId: number): Promise<Atendimento[]> {
  const { atendimentos } = await request<{ atendimentos: ApiAtendimento[] }>(accessToken, `/atendimentos?pacienteId=${pacienteId}`)
  return atendimentos.map((atendimento) => paraAtendimento(atendimento))
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

export async function alterarSituacaoFicha(accessToken: string, atendimentoId: number, situacao: Atendimento['situacao'], motivoEncerramento: Atendimento['motivoEncerramento'], dataEncerramento: string | null): Promise<void> {
  await request(accessToken, `/atendimentos/${atendimentoId}/situacao`, {
    method: 'POST', body: JSON.stringify({ situacao, motivoEncerramento, dataEncerramento }),
  })
}

export async function createAtendimento(accessToken: string, medicoId: number, input: AtendimentoInput): Promise<Atendimento> {
  if (input.status !== 'agendada') throw new Error('Novos atendimentos devem ser agendados antes de iniciar.')
  const { atendimento } = await request<{ atendimento: ApiAtendimento }>(accessToken, '/atendimentos', {
    method: 'POST',
    body: JSON.stringify({
      pacienteId: input.pacienteId,
      medicoId,
      dataHoraPrevista: dataHoraIso(input),
      procedimento: input.procedimento,
      procedimentoOutro: input.procedimento === 'Outro' ? input.procedimentoOutro : null,
      observacoes: input.descricao || null,
    }),
  })

  return paraAtendimento(atendimento)
}

export async function updateAtendimento(
  accessToken: string,
  medicoId: number,
  id: number,
  input: AtendimentoInput,
): Promise<Atendimento> {
  let { atendimento } = await request<{ atendimento: ApiAtendimento }>(accessToken, `/atendimentos/${id}`)
  if (atendimento.status === 'CONCLUIDA') {
    ;({ atendimento } = await request<{ atendimento: ApiAtendimento }>(accessToken, `/atendimentos/${id}/corrigir`, {
      method: 'POST',
      body: JSON.stringify({
        procedimento: input.procedimento,
        procedimentoOutro: input.procedimento === 'Outro' ? input.procedimentoOutro : null,
        observacoes: input.descricao || null,
        clinico: camposClinicosPayload(input),
      }),
    }))
    return paraAtendimento(atendimento)
  }
  if (atendimento.status === 'CANCELADA') {
    throw new Error('Atendimentos cancelados não podem ser alterados.')
  }

  if (input.status === 'cancelada') {
    ;({ atendimento } = await request<{ atendimento: ApiAtendimento }>(accessToken, `/atendimentos/${id}/cancelar`, {
      method: 'POST',
    }))
    return paraAtendimento(atendimento)
  }

  if (atendimento.status === 'AGENDADA') {
    ;({ atendimento } = await request<{ atendimento: ApiAtendimento }>(accessToken, `/atendimentos/${id}/agendamento`, {
      method: 'PATCH',
      body: JSON.stringify({
        medicoId,
        dataHoraPrevista: dataHoraIso(input),
        procedimento: input.procedimento,
        procedimentoOutro: input.procedimento === 'Outro' ? input.procedimentoOutro : null,
        observacoes: input.descricao || null,
      }),
    }))
    if (input.status === 'agendada') return paraAtendimento(atendimento)
    ;({ atendimento } = await request<{ atendimento: ApiAtendimento }>(accessToken, `/atendimentos/${id}/iniciar`, {
      method: 'POST',
    }))
  } else if (input.status === 'agendada') {
    throw new Error('Um atendimento iniciado não pode voltar para agendado.')
  }

  ;({ atendimento } = await request<{ atendimento: ApiAtendimento }>(accessToken, `/atendimentos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      procedimento: input.procedimento,
      procedimentoOutro: input.procedimento === 'Outro' ? input.procedimentoOutro : null,
      observacoes: input.descricao || null,
      clinico: camposClinicosPayload(input),
    }),
  }))

  if (input.status === 'concluida') {
    ;({ atendimento } = await request<{ atendimento: ApiAtendimento }>(accessToken, `/atendimentos/${id}/concluir`, {
      method: 'POST',
    }))
  }
  return paraAtendimento(atendimento)
}

export async function cancelarAtendimento(accessToken: string, id: number): Promise<void> {
  await request(accessToken, `/atendimentos/${id}/cancelar`, { method: 'POST' })
}

export async function iniciarAtendimento(accessToken: string, id: number): Promise<Atendimento> {
  const { atendimento } = await request<{ atendimento: ApiAtendimento }>(accessToken, `/atendimentos/${id}/iniciar`, {
    method: 'POST',
  })
  return paraAtendimento(atendimento)
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
