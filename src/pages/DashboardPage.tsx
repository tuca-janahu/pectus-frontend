import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { IconActivity, IconCalendar, IconMapPin, IconRefresh, IconUsers } from '../components/icons'
import { Barras, GraficoRosca, SerieAtendimentos } from '../components/dashboard/Charts'
import { Button, Card } from '../components/ui'
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
  return <Card padded={false}>
    <div className="border-b border-tm-border px-4 py-3">
      <h2 className="font-tm-display text-tm-md font-bold text-tm-fg">{titulo}</h2>
      {descricao && <p className="mt-0.5 text-tm-xs leading-4 text-tm-fg-muted">{descricao}</p>}
    </div>
    <div className="px-4 py-3">{children}</div>
  </Card>
}

function Kpi({ titulo, valor, nota, cor, icon }: { titulo: string; valor: number; nota: string; cor: string; icon: React.ReactNode }) {
  return <Card padded={false}>
    <div className="flex min-h-[108px] flex-col px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 text-tm-sm font-semibold text-tm-fg-muted">{titulo}</span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-tm-sm" style={{ background: `var(--tm-accent-${cor}-bg)`, color: `var(--tm-accent-${cor}-fg)` }} aria-hidden="true">{icon}</span>
      </div>
      <div className="mt-1 font-tm-display text-tm-5xl font-extrabold leading-none tracking-tight text-tm-fg">{valor.toLocaleString('pt-BR')}</div>
      <p className="mt-auto pt-1 text-tm-xs leading-4 text-tm-fg-subtle">{nota}</p>
    </div>
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

  return <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-3 text-tm-fg">
    <section aria-label="Filtros do dashboard" className="hidden flex-wrap items-end gap-2 rounded-tm-card border border-tm-border bg-tm-surface px-3 py-2.5 shadow-tm-card md:flex">
      <div className="flex flex-wrap gap-1.5 self-end">
        {[30, 90, 365].map((dias) => (
          <button key={dias} type="button"
            onClick={() => alterar({ de: diasAntes(hoje, dias - 1), ate: hoje, granularidade: dias === 30 ? 'dia' : 'mes' })}
            className="h-8 rounded-tm-sm border border-tm-border bg-tm-surface-2 px-2.5 text-tm-xs font-semibold text-tm-fg-muted transition-colors hover:border-tm-primary hover:text-tm-primary">
            {dias === 365 ? '12 meses' : dias + ' dias'}
          </button>
        ))}
      </div>
      <div className="mx-1 hidden h-8 w-px self-end bg-tm-border xl:block" />
      <label className="flex min-w-[135px] flex-col gap-1 text-tm-xs font-semibold text-tm-fg-muted">De
        <input type="date" value={filtro.de} onChange={(event) => alterar({ de: event.target.value })}
          className="h-8 rounded-tm-sm border border-tm-border bg-tm-surface px-2 text-tm-sm font-normal text-tm-fg focus:outline-2 focus:outline-tm-primary" />
      </label>
      <label className="flex min-w-[135px] flex-col gap-1 text-tm-xs font-semibold text-tm-fg-muted">Até
        <input type="date" value={filtro.ate} onChange={(event) => alterar({ ate: event.target.value })}
          className="h-8 rounded-tm-sm border border-tm-border bg-tm-surface px-2 text-tm-sm font-normal text-tm-fg focus:outline-2 focus:outline-tm-primary" />
      </label>
      <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-tm-xs font-semibold text-tm-fg-muted">Médico
        <select value={String(filtro.medicoId ?? '')} onChange={(event) => alterar({ medicoId: event.target.value ? Number(event.target.value) : undefined })}
          className="h-8 w-full rounded-tm-sm border border-tm-border bg-tm-surface px-2 text-tm-sm font-normal text-tm-fg focus:outline-2 focus:outline-tm-primary">
          <option value="">Todos os médicos</option>
          {medicos.map((medico) => <option key={medico.id} value={medico.id}>{medico.nome}</option>)}
        </select>
      </label>
      <label className="flex min-w-[120px] flex-col gap-1 text-tm-xs font-semibold text-tm-fg-muted">Agrupamento
        <select value={filtro.granularidade} onChange={(event) => alterar({ granularidade: event.target.value as Granularidade })}
          className="h-8 rounded-tm-sm border border-tm-border bg-tm-surface px-2 text-tm-sm font-normal text-tm-fg focus:outline-2 focus:outline-tm-primary">
          <option value="dia">Dia</option><option value="semana">Semana</option><option value="mes">Mês</option>
        </select>
      </label>
      <Button variant="secondary" size="sm" icon={<IconRefresh size={14} />} onClick={() => setRefresh((n) => n + 1)} aria-label="Atualizar dados" className="h-8 px-2.5">Atualizar</Button>
    </section>

    <p className="text-tm-sm text-tm-fg-muted md:hidden">
      Indicadores de {filtro.de.split('-').reverse().join('/')} a {filtro.ate.split('-').reverse().join('/')}
      {filtro.medicoId ? ` · ${medicos.find((medico) => medico.id === filtro.medicoId)?.nome ?? 'Médico selecionado'}` : ' · Todos os médicos'}
    </p>

    {erro && <Card padded={false}><div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><p className="text-tm-sm text-tm-danger-fg">{erro}</p><Button variant="secondary" size="sm" onClick={() => setRefresh((n) => n + 1)}>Tentar novamente</Button></div></Card>}
    {loading && <div role="status" aria-label="Carregando indicadores" className="grid animate-pulse grid-cols-2 gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <div key={i} className="h-24 rounded-tm-card bg-tm-surface-2" />)}</div>}
    {!loading && !erro && resumo && <>
      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-5" aria-label="Indicadores gerais">
        <Kpi titulo="Atendimentos" valor={resumo.indicadores.atendimentos} nota="Todos os status no período" cor="primary" icon={<IconCalendar size={16} />} />
        <Kpi titulo="Concluídos" valor={resumo.indicadores.concluidos} nota="Data prevista no período" cor="green" icon={<IconActivity size={16} />} />
        <Kpi titulo="Cancelados" valor={resumo.indicadores.cancelados} nota="Data prevista no período" cor="amber" icon={<IconCalendar size={16} />} />
        <Kpi titulo="Pacientes atendidos" valor={resumo.indicadores.pacientesAtendidos} nota="Distintos, com atendimento concluído" cor="violet" icon={<IconUsers size={16} />} />
        <div className="col-span-2 md:col-span-1">
          <Kpi titulo="Em tratamento" valor={resumo.indicadores.fichasEmTratamento} nota="Fichas atuais dos pacientes atendidos" cor="primary" icon={<IconActivity size={16} />} />
        </div>
      </section>

      {vazio && <div className="hidden rounded-tm-card border border-tm-border bg-tm-surface px-4 py-2 text-tm-sm text-tm-fg-muted md:block">Nenhum atendimento no período selecionado. Ajuste as datas ou o médico.</div>}

      <section className="hidden gap-2.5 md:grid lg:grid-cols-12" aria-label="Visão principal">
        <div className="lg:col-span-7">
          <Card padded={false}>
            <div className="flex items-center justify-between gap-3 border-b border-tm-border px-4 py-3">
              <div>
                <h2 className="font-tm-display text-tm-md font-bold">Mapa de calor por estado</h2>
                <p className="text-tm-xs text-tm-fg-muted">Distribuição geográfica dos pacientes</p>
              </div>
              <span className="rounded-full bg-tm-surface-2 px-2 py-1 text-[10px] font-semibold text-tm-fg-muted">Em breve</span>
            </div>
            <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-tm-surface-2/50 p-5 md:min-h-[250px]"
              style={{ backgroundImage: 'radial-gradient(var(--tm-border) 0.8px, transparent 0.8px)', backgroundSize: '18px 18px' }}>
              <div className="relative flex max-w-xs flex-col items-center rounded-tm-card border border-tm-border bg-tm-surface px-5 py-4 text-center shadow-tm-card">
                <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-tm-sm bg-tm-accent-primary-bg text-tm-accent-primary-fg"><IconMapPin size={18} /></span>
                <strong className="text-tm-sm">Área reservada para o mapa</strong>
                <span className="mt-1 text-tm-xs leading-4 text-tm-fg-muted">O mapa de calor por estado ocupará este espaço.</span>
              </div>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-5">
          <Bloco titulo="Evolução dos atendimentos" descricao="Data prevista · selecione uma coluna para abrir os registros">
            <SerieAtendimentos serie={resumo.serieAtendimentos} granularidade={filtro.granularidade}
              onSelect={(periodo) => abrirAtendimentos(periodo, periodoFinal(periodo, filtro.granularidade))} />
          </Bloco>
        </div>
      </section>

      <section className="hidden gap-2.5 md:grid md:grid-cols-2 xl:grid-cols-12" aria-label="Atendimentos e origem">
        <div className="xl:col-span-3">
          <Bloco titulo="Situação dos atendimentos">
            <Barras dados={resumo.porStatus.map((item) => ({ label: STATUS[item.status], total: item.total }))}
              cor="var(--tm-status-concluida-dot)"
              onSelect={(label) => abrirAtendimentos(undefined, undefined, Object.keys(STATUS).find((status) => STATUS[status] === label))} />
          </Bloco>
        </div>
        <div className="xl:col-span-4">
          <Bloco titulo="Procedimentos" descricao="Atendimentos não cancelados">
            <Barras dados={resumo.porProcedimento.map((item) => ({ label: item.procedimento, total: item.total }))} />
          </Bloco>
        </div>
        <div className="md:col-span-2 xl:col-span-5">
          <Bloco titulo="Origem dos pacientes" descricao="Pacientes distintos com atendimento concluído">
            <Barras dados={resumo.regiao.porGrupo.map((item) => ({ label: item.grupo === 'RM_BELEM' ? 'Região Metropolitana de Belém' : item.grupo === 'OUTRAS_LOCALIDADES' ? 'Outras localidades' : 'Não informado', total: item.total }))} cor="var(--tm-accent-primary-fg)" />
            {resumo.regiao.municipiosRmBelem.length > 0 && <div className="mt-3 border-t border-tm-border pt-2">
              <div className="mb-1.5 text-tm-xs font-semibold text-tm-fg-muted">Municípios da região metropolitana</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-tm-xs">
                {resumo.regiao.municipiosRmBelem.slice(0, 4).map((item) => <div key={item.codigo} className="flex justify-between gap-2"><span className="truncate">{item.municipio}</span><strong>{item.total}</strong></div>)}
              </div>
              {resumo.regiao.municipiosRmBelem.length > 4 && <details className="mt-1 text-tm-xs text-tm-fg-muted">
                <summary className="cursor-pointer text-tm-primary">Ver todos os municípios</summary>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                  {resumo.regiao.municipiosRmBelem.slice(4).map((item) => <div key={item.codigo} className="flex justify-between gap-2"><span className="truncate">{item.municipio}</span><strong>{item.total}</strong></div>)}
                </div>
              </details>}
            </div>}
          </Bloco>
        </div>
      </section>

      <section className="hidden gap-2.5 md:grid md:grid-cols-2 xl:grid-cols-12" aria-label="Perfil dos pacientes">
        <div className="xl:col-span-3">
          <Bloco titulo="Faixa etária" descricao="Idade ao fim do período">
            <Barras dados={resumo.demografia.porFaixaEtaria.map((item) => ({ label: item.faixa + ' anos', total: item.total }))} cor="var(--tm-accent-violet-fg)" />
          </Bloco>
        </div>
        <div className="xl:col-span-2">
          <Bloco titulo="Gênero">
            <GraficoRosca rotuloTotal="pacientes" dados={resumo.demografia.porGenero.map((item) => ({
              label: item.genero === 'MASCULINO' ? 'Masculino' : 'Feminino',
              total: item.total,
              cor: item.genero === 'MASCULINO' ? 'var(--tm-primary)' : 'var(--tm-accent-violet-fg)',
            }))} />
          </Bloco>
        </div>
        <div className="xl:col-span-4">
          <Bloco titulo="Indicadores clínicos" descricao="Registros positivos na Ficha atual">
            <Barras dados={resumo.clinica.registrosPositivos.map((item) => ({ label: CLINICA[item.indicador] ?? item.indicador, total: item.total }))} cor="var(--tm-accent-violet-fg)" />
          </Bloco>
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <Bloco titulo="Situação das fichas" descricao="Estado atual dos pacientes atendidos">
            <GraficoRosca rotuloTotal="fichas" dados={resumo.clinica.porSituacao.map((item) => ({
              label: item.situacao === 'EM_TRATAMENTO' ? 'Em tratamento' : 'Fora de tratamento',
              total: item.total,
              cor: item.situacao === 'EM_TRATAMENTO' ? 'var(--tm-accent-green-fg)' : 'var(--tm-status-pendente-dot)',
            }))} />
            {resumo.clinica.porMotivoEncerramento.some((item) => item.total > 0) && <div className="mt-3 border-t border-tm-border pt-2 text-tm-xs text-tm-fg-muted">Encerramentos: {resumo.clinica.porMotivoEncerramento.map((item) => item.motivo.toLowerCase() + ' ' + item.total).join(' · ')}</div>}
          </Bloco>
        </div>
      </section>
      <p className="hidden px-1 text-[10px] text-tm-fg-subtle md:block">Período pela data prevista do atendimento · Fuso: America/Sao_Paulo · Dados clínicos refletem a Ficha atual.</p>
    </>}
  </div>
}
