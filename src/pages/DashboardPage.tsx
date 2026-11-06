import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { IconActivity, IconCalendar, IconChart, IconRefresh, IconUsers } from '../components/icons'
import { Barras, SerieAtendimentos } from '../components/dashboard/Charts'
import { Button, Card, Select } from '../components/ui'
import { getDashboardMedicos, getDashboardResumo, type DashboardFiltro, type DashboardResumo, type Granularidade } from '../lib/dashboard'

function hojeEmBelem() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const valor = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? ''
  return `${valor('year')}-${valor('month')}-${valor('day')}`
}

function diasAntes(iso: string, dias: number) {
  const data = new Date(`${iso}T12:00:00Z`)
  data.setUTCDate(data.getUTCDate() - dias)
  return data.toISOString().slice(0, 10)
}

function valido(iso: string | null) {
  return iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null
}

function periodoFinal(inicio: string, granularidade: Granularidade) {
  const data = new Date(`${inicio}T12:00:00Z`)
  if (granularidade === 'mes') data.setUTCMonth(data.getUTCMonth() + 1, 0)
  else data.setUTCDate(data.getUTCDate() + (granularidade === 'semana' ? 6 : 0))
  return data.toISOString().slice(0, 10)
}

const CLINICA: Record<string, string> = {
  vocaliza: 'Vocaliza', traqueostomizado: 'Traqueostomizado', comorbidades: 'Comorbidades',
  sequelas: 'Sequelas', medicamentos: 'Usa medicamentos', laringoscopia: 'Possui laringoscopia',
}
const STATUS: Record<string, string> = {
  AGENDADA: 'Agendados', EM_PREENCHIMENTO: 'Em preenchimento', CONCLUIDA: 'Concluídos', CANCELADA: 'Cancelados',
}

function Bloco({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return <Card>
    <div className="mb-5">
      <h2 className="font-tm-display text-tm-lg font-bold text-tm-fg">{titulo}</h2>
      {descricao && <p className="mt-1 text-tm-sm text-tm-fg-muted">{descricao}</p>}
    </div>
    {children}
  </Card>
}

function Kpi({ titulo, valor, nota, cor, icon }: { titulo: string; valor: number; nota: string; cor: string; icon: React.ReactNode }) {
  return <Card>
    <div className="flex items-start justify-between gap-3">
      <span className="text-tm-sm font-medium text-tm-fg-muted">{titulo}</span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-tm-sm" style={{ background: `var(--tm-accent-${cor}-bg)`, color: `var(--tm-accent-${cor}-fg)` }}>{icon}</span>
    </div>
    <div className="mt-3 font-tm-display text-[30px] font-extrabold tracking-tight text-tm-fg">{valor.toLocaleString('pt-BR')}</div>
    <p className="mt-1 text-tm-xs text-tm-fg-subtle">{nota}</p>
  </Card>
}

export function DashboardPage() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const hoje = hojeEmBelem()
  const filtro = useMemo<DashboardFiltro>(() => {
    const medico = Number(params.get('medicoId'))
    const granularidade = params.get('granularidade')
    return {
      de: valido(params.get('de')) ?? diasAntes(hoje, 364),
      ate: valido(params.get('ate')) ?? hoje,
      medicoId: Number.isInteger(medico) && medico > 0 ? medico : undefined,
      granularidade: granularidade === 'dia' || granularidade === 'semana' ? granularidade : 'mes',
    }
  }, [params, hoje])
  const [resumo, setResumo] = useState<DashboardResumo | null>(null)
  const [medicos, setMedicos] = useState<Array<{ id: number; nome: string }>>([])
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    if (!accessToken) return
    getDashboardMedicos(accessToken).then(({ medicos: lista }) => setMedicos(lista)).catch(() => setMedicos([]))
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) return
    const controller = new AbortController()
    setLoading(true)
    setErro(null)
    getDashboardResumo(accessToken, filtro, controller.signal)
      .then((dados) => setResumo(dados))
      .catch((error) => { if (!controller.signal.aborted) setErro(error instanceof Error ? error.message : 'Erro ao carregar dashboard') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [accessToken, filtro, refresh])

  function alterar(changes: Partial<DashboardFiltro>) {
    const novo = { ...filtro, ...changes }
    const dias = (Date.parse(novo.ate) - Date.parse(novo.de)) / 86_400_000
    if (novo.granularidade === 'dia' && dias > 90) novo.granularidade = 'mes'
    if (novo.granularidade === 'semana' && dias > 365) novo.granularidade = 'mes'
    const query = new URLSearchParams({ de: novo.de, ate: novo.ate, granularidade: novo.granularidade })
    if (novo.medicoId) query.set('medicoId', String(novo.medicoId))
    setParams(query)
  }

  function abrirAtendimentos(de?: string, ate?: string, status?: string) {
    const query = new URLSearchParams({ de: de && de > filtro.de ? de : filtro.de, ate: ate && ate < filtro.ate ? ate : filtro.ate })
    if (filtro.medicoId) query.set('medicoId', String(filtro.medicoId))
    if (status) query.set('status', status)
    navigate(`/atendimentos?${query}`)
  }

  const vazio = !loading && resumo?.indicadores.atendimentos === 0

  return <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 text-tm-fg">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-tm-accent-primary-bg px-3 py-1 text-tm-xs font-bold uppercase tracking-wider text-tm-accent-primary-fg"><IconChart size={14} /> Visão da clínica</div>
        <h1 className="font-tm-display text-tm-6xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-tm-md text-tm-fg-muted">Atendimentos, pacientes e condição clínica atual em um só lugar.</p>
      </div>
      <Button variant="secondary" size="sm" icon={<IconRefresh size={15} />} onClick={() => setRefresh((n) => n + 1)}>Atualizar dados</Button>
    </header>

    <Card>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-tm-base font-semibold">De
            <input type="date" value={filtro.de} onChange={(event) => alterar({ de: event.target.value })}
              className="h-11 rounded-tm-input border border-tm-border bg-tm-surface px-3 text-tm-md font-normal text-tm-fg focus:outline-2 focus:outline-tm-primary" /></label>
          <label className="flex flex-col gap-1.5 text-tm-base font-semibold">Até
            <input type="date" value={filtro.ate} onChange={(event) => alterar({ ate: event.target.value })}
              className="h-11 rounded-tm-input border border-tm-border bg-tm-surface px-3 text-tm-md font-normal text-tm-fg focus:outline-2 focus:outline-tm-primary" /></label>
          <Select label="Médico" value={String(filtro.medicoId ?? '')} onChange={(value) => alterar({ medicoId: value ? Number(value) : undefined })}
            options={[{ value: '', label: 'Todos os médicos' }, ...medicos.map((medico) => ({ value: String(medico.id), label: medico.nome }))]} />
          <Select label="Agrupamento" value={filtro.granularidade} onChange={(value) => alterar({ granularidade: value as Granularidade })}
            options={[{ value: 'dia', label: 'Dia (até 90 dias)' }, { value: 'semana', label: 'Semana (até 1 ano)' }, { value: 'mes', label: 'Mês' }]} />
        </div>
        <div className="flex flex-wrap gap-2">
          {[30, 90, 365].map((dias) => <Button key={dias} variant="secondary" size="sm" onClick={() => alterar({ de: diasAntes(hoje, dias - 1), ate: hoje, granularidade: dias === 30 ? 'dia' : 'mes' })}>{dias === 365 ? '12 meses' : `${dias} dias`}</Button>)}
        </div>
      </div>
    </Card>

    {erro && <Card><div role="alert" className="flex flex-wrap items-center justify-between gap-3"><p className="text-tm-md text-tm-danger-fg">{erro}</p><Button variant="secondary" size="sm" onClick={() => setRefresh((n) => n + 1)}>Tentar novamente</Button></div></Card>}
    {loading && <div role="status" className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <div key={i} className="h-32 rounded-tm-card bg-tm-surface-2" />)}</div>}
    {!loading && !erro && resumo && <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Indicadores gerais">
        <Kpi titulo="Atendimentos" valor={resumo.indicadores.atendimentos} nota="Todos os status no período" cor="primary" icon={<IconCalendar size={19} />} />
        <Kpi titulo="Concluídos" valor={resumo.indicadores.concluidos} nota="Data prevista no período" cor="green" icon={<IconActivity size={19} />} />
        <Kpi titulo="Cancelados" valor={resumo.indicadores.cancelados} nota="Data prevista no período" cor="amber" icon={<IconCalendar size={19} />} />
        <Kpi titulo="Pacientes atendidos" valor={resumo.indicadores.pacientesAtendidos} nota="Distintos, com atendimento concluído" cor="violet" icon={<IconUsers size={19} />} />
        <Kpi titulo="Em tratamento" valor={resumo.indicadores.fichasEmTratamento} nota="Fichas atuais dos pacientes atendidos" cor="primary" icon={<IconActivity size={19} />} />
      </section>

      {vazio && <Card><p className="py-5 text-center text-tm-md text-tm-fg-muted">Nenhum atendimento no período selecionado. Ajuste as datas ou o médico.</p></Card>}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]" aria-label="Atendimentos">
        <Bloco titulo="Evolução dos atendimentos" descricao="Agrupados pela data prevista. Selecione uma coluna para ver os registros.">
          <SerieAtendimentos serie={resumo.serieAtendimentos} granularidade={filtro.granularidade}
            onSelect={(periodo) => abrirAtendimentos(periodo, periodoFinal(periodo, filtro.granularidade))} />
        </Bloco>
        <Bloco titulo="Situação dos atendimentos" descricao="Distribuição no período selecionado.">
          <Barras dados={resumo.porStatus.map((item) => ({ label: STATUS[item.status], total: item.total }))}
            cor="var(--tm-status-concluida-dot)" onSelect={(label) => abrirAtendimentos(undefined, undefined, Object.keys(STATUS).find((status) => STATUS[status] === label))} />
        </Bloco>
      </section>

      <section className="grid gap-4 xl:grid-cols-2" aria-label="Procedimentos e demografia">
        <Bloco titulo="Procedimentos mais frequentes" descricao="Atendimentos não cancelados no período.">
          <Barras dados={resumo.porProcedimento.slice(0, 8).map((item) => ({ label: item.procedimento, total: item.total }))} />
        </Bloco>
        <Bloco titulo="Perfil etário" descricao={`${resumo.demografia.denominadorPacientes} pacientes distintos com atendimento concluído. Idade ao fim do período.`}>
          <Barras dados={resumo.demografia.porFaixaEtaria.map((item) => ({ label: `${item.faixa} anos`, total: item.total }))} cor="var(--tm-accent-violet-fg)" />
        </Bloco>
        <Bloco titulo="Gênero dos pacientes" descricao="Pacientes distintos com atendimento concluído.">
          <Barras dados={resumo.demografia.porGenero.map((item) => ({ label: item.genero === 'MASCULINO' ? 'Masculino' : 'Feminino', total: item.total }))} cor="var(--tm-accent-primary-fg)" />
        </Bloco>
        <Bloco titulo="Situação das fichas" descricao="Estado atual das fichas dos pacientes atendidos no período.">
          <Barras dados={resumo.clinica.porSituacao.map((item) => ({ label: item.situacao === 'EM_TRATAMENTO' ? 'Em tratamento' : 'Fora de tratamento', total: item.total }))} cor="var(--tm-accent-green-fg)" />
          {resumo.clinica.porMotivoEncerramento.some((item) => item.total > 0) && <div className="mt-5 border-t border-tm-border pt-4 text-tm-sm text-tm-fg-muted">Encerramentos: {resumo.clinica.porMotivoEncerramento.map((item) => `${item.motivo.toLowerCase()} ${item.total}`).join(' · ')}</div>}
        </Bloco>
      </section>

      <section className="grid gap-4 xl:grid-cols-2" aria-label="Indicadores clínicos e região">
        <Bloco titulo="Indicadores clínicos" descricao="Registros positivos na Ficha atual dos pacientes atendidos. O histórico está nos atendimentos.">
          <Barras dados={resumo.clinica.registrosPositivos.map((item) => ({ label: CLINICA[item.indicador] ?? item.indicador, total: item.total }))} cor="var(--tm-accent-violet-fg)" />
        </Bloco>
        <div className="flex flex-col gap-4">
          <Bloco titulo="Região Metropolitana de Belém" descricao="Localidade dos pacientes distintos com atendimento concluído.">
            <Barras dados={resumo.regiao.porGrupo.map((item) => ({ label: item.grupo === 'RM_BELEM' ? 'Região Metropolitana de Belém' : item.grupo === 'OUTRAS_LOCALIDADES' ? 'Outras localidades' : 'Não informado', total: item.total }))} cor="var(--tm-accent-primary-fg)" />
          </Bloco>
          <Bloco titulo="Municípios da região metropolitana" descricao="Distribuição entre os municípios marcados no cadastro de localidades.">
            <Barras dados={resumo.regiao.municipiosRmBelem.map((item) => ({ label: item.municipio, total: item.total }))} cor="var(--tm-accent-green-fg)" />
          </Bloco>
        </div>
      </section>
      <p className="text-tm-xs text-tm-fg-subtle">Período pela data prevista do atendimento · Fuso: America/Sao_Paulo · Dados clínicos e situação refletem a Ficha atual.</p>
    </>}
  </div>
}
