const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export type Granularidade = 'dia' | 'semana' | 'mes'
export type StatusDashboard = 'AGENDADA' | 'EM_PREENCHIMENTO' | 'CONCLUIDA' | 'CANCELADA'
export interface DashboardFiltro { de: string; ate: string; medicoId?: number; granularidade: Granularidade }
export interface Contagem { total: number }
export interface DashboardResumo {
  periodo: DashboardFiltro & { fuso: string }
  indicadores: { atendimentos: number; concluidos: number; cancelados: number; pacientesAtendidos: number; fichasEmTratamento: number }
  serieAtendimentos: Array<{ periodo: string } & Record<StatusDashboard, number>>
  porStatus: Array<{ status: StatusDashboard; total: number }>
  porProcedimento: Array<{ procedimento: string; total: number }>
  demografia: {
    denominadorPacientes: number
    porFaixaEtaria: Array<{ faixa: string; total: number }>
    porGenero: Array<{ genero: 'MASCULINO' | 'FEMININO'; total: number }>
  }
  clinica: {
    denominadorPacientes: number
    registrosPositivos: Array<{ indicador: string; total: number }>
    porSituacao: Array<{ situacao: string; total: number }>
    porMotivoEncerramento: Array<{ motivo: string; total: number }>
  }
  regiao: {
    denominadorPacientes: number
    porGrupo: Array<{ grupo: string; total: number }>
    municipiosRmBelem: Array<{ codigo: number; municipio: string; total: number }>
  }
}

async function json<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error ?? 'Não foi possível carregar o dashboard.')
  return body as T
}

export function getDashboardResumo(token: string, filtro: DashboardFiltro, signal?: AbortSignal) {
  const params = new URLSearchParams({ de: filtro.de, ate: filtro.ate, granularidade: filtro.granularidade })
  if (filtro.medicoId) params.set('medicoId', String(filtro.medicoId))
  return fetch(`${API_URL}/dashboard/resumo?${params}`, {
    headers: { Authorization: `Bearer ${token}` }, signal,
  }).then((response) => json<DashboardResumo>(response))
}

export function getDashboardMedicos(token: string) {
  return fetch(`${API_URL}/dashboard/medicos`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((response) => json<{ medicos: Array<{ id: number; nome: string }> }>(response))
}
