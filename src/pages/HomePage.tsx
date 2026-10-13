import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { IconArrowRight, IconCalendar, IconChevronRight, IconPlus, IconRefresh } from '../components/icons'
import { Avatar, Button, Card, EmptyState, StatusBadge, type AvatarColor } from '../components/ui'
import { listPacientes, type AuthUser, type PacienteResumo } from '../lib/api'
import { listFichas, type Ficha } from '../lib/fichasStore'

const AVATAR_COLORS: AvatarColor[] = ['sky', 'teal', 'violet', 'rose', 'amber']

function hojeISO(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function obterSaudacao(user: AuthUser, date = new Date()): string {
  const hora = date.getHours()
  const cumprimento = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const primeiroNome = user.nome.trim().split(/\s+/)[0] || 'usuário'
  const prefixo = user.roles.includes('MEDICO') ? 'Dr. ' : ''
  return `${cumprimento}, ${prefixo}${primeiroNome}.`
}

function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return '?'
}

function ordenarPorDataHora(a: Ficha, b: Ficha): number {
  return `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`)
}

function selecionarAgenda(fichas: Ficha[], user: AuthUser, hoje = hojeISO()) {
  const fichasVisiveis = user.roles.includes('MEDICO')
    ? user.medico
      ? fichas.filter((ficha) => ficha.medicoId === user.medico?.id)
      : []
    : fichas

  const deHoje = fichasVisiveis
    .filter((ficha) => ficha.data === hoje && (ficha.status === 'agendada' || ficha.status === 'pendente'))
    .sort(ordenarPorDataHora)

  const proximas = fichasVisiveis
    .filter((ficha) => ficha.data > hoje && ficha.status === 'agendada')
    .sort(ordenarPorDataHora)
    .slice(0, 5)

  return { deHoje, proximas }
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(ano, mes - 1, dia))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function agruparPorData(fichas: Ficha[]): Array<{ data: string; fichas: Ficha[] }> {
  const grupos = new Map<string, Ficha[]>()
  fichas.forEach((ficha) => {
    const grupo = grupos.get(ficha.data) ?? []
    grupo.push(ficha)
    grupos.set(ficha.data, grupo)
  })
  return Array.from(grupos, ([data, itens]) => ({ data, fichas: itens }))
}

function LinhaDaAgenda({ ficha, pacientes }: { ficha: Ficha; pacientes: PacienteResumo[] }) {
  const navigate = useNavigate()
  const paciente = pacientes.find((item) => item.id === ficha.pacienteId)
  const nome = paciente?.nome ?? 'Paciente removido'

  return (
    <button
      type="button"
      onClick={() => navigate(`/fichas/${ficha.id}/editar`)}
      className="group flex w-full items-center gap-3 border-b border-tm-border px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-tm-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tm-primary sm:gap-4 sm:px-5"
      aria-label={`Abrir ficha de ${nome}, às ${ficha.hora}`}
    >
      <div className="flex w-14 shrink-0 flex-col items-center border-r border-tm-border pr-3 sm:w-16 sm:pr-4">
        <span className="text-tm-2xl font-bold tracking-[-0.02em] text-tm-fg">{ficha.hora}</span>
        <span className="text-tm-2xs font-semibold uppercase tracking-wider text-tm-fg-subtle">hrs</span>
      </div>

      <Avatar
        initials={paciente ? obterIniciais(paciente.nome) : '?'}
        color={AVATAR_COLORS[ficha.pacienteId % AVATAR_COLORS.length]}
        size={40}
        src={paciente?.fotoUrl || undefined}
      />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-tm-lg font-semibold tracking-[-0.005em] text-tm-fg">{nome}</span>
          <StatusBadge status={ficha.status} />
        </div>
        <p className="mt-0.5 truncate text-tm-base text-tm-fg-muted">{ficha.procedimento}</p>
      </div>

      <IconChevronRight
        size={19}
        className="shrink-0 text-tm-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-tm-primary"
      />
    </button>
  )
}

function AgendaSkeleton() {
  return (
    <div aria-label="Carregando agenda" className="animate-pulse">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-center gap-4 border-b border-tm-border px-5 py-4 last:border-b-0">
          <div className="h-8 w-14 rounded-tm-sm bg-tm-surface-2" />
          <div className="h-10 w-10 rounded-full bg-tm-surface-2" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3.5 w-40 max-w-[60%] rounded-full bg-tm-surface-2" />
            <div className="h-3 w-28 max-w-[45%] rounded-full bg-tm-surface-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { accessToken, user } = useAuth()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregarAgenda = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)
    try {
      const [listaFichas, pacientesResponse] = await Promise.all([
        listFichas(accessToken),
        listPacientes(accessToken),
      ])
      setFichas(listaFichas)
      setPacientes(pacientesResponse.pacientes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar sua agenda.')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void carregarAgenda()
  }, [carregarAgenda])

  const agenda = useMemo(
    () => (user ? selecionarAgenda(fichas, user) : { deHoje: [], proximas: [] }),
    [fichas, user],
  )
  const proximasPorData = useMemo(() => agruparPorData(agenda.proximas), [agenda.proximas])
  const semAgenda = agenda.deHoje.length === 0 && agenda.proximas.length === 0
  const totalAgenda = agenda.deHoje.length + agenda.proximas.length
  const resumoAgenda = loading
    ? 'Atualizando sua agenda'
    : error
      ? 'Os dados da agenda estão indisponíveis'
      : `${agenda.deHoje.length} ${agenda.deHoje.length === 1 ? 'ficha hoje' : 'fichas hoje'} · ${agenda.proximas.length} ${
          agenda.proximas.length === 1 ? 'próxima' : 'próximas'
        }`

  if (!user) return null

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 text-tm-fg">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-tm-display text-tm-6xl font-bold tracking-[-0.03em]">{obterSaudacao(user)}</h1>
          <p className="mt-1 text-tm-md text-tm-fg-muted">Aqui está um resumo dos seus próximos atendimentos.</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            className="flex-1 sm:flex-none"
            size="sm"
            variant="secondary"
            iconRight={<IconArrowRight size={15} />}
            onClick={() => navigate('/fichas')}
          >
            Ver todas
          </Button>
          <Button
            className="flex-1 sm:flex-none"
            size="sm"
            icon={<IconPlus size={16} />}
            onClick={() => navigate('/fichas/nova')}
          >
            Nova ficha
          </Button>
        </div>
      </header>

      <Card padded={false}>
        <div className="overflow-hidden rounded-tm-card">
          <div className="flex items-center justify-between gap-4 border-b border-tm-border px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-tm-sm bg-tm-accent-primary-bg text-tm-accent-primary-fg">
                <IconCalendar size={20} />
              </div>
              <div className="min-w-0">
                <h2 className="text-tm-lg font-semibold tracking-[-0.005em] text-tm-fg">Agenda de atendimentos</h2>
                <p className="truncate text-tm-sm text-tm-fg-muted">{resumoAgenda}</p>
              </div>
            </div>
            {!loading && !error && totalAgenda > 0 && (
              <span className="shrink-0 rounded-full bg-tm-surface-2 px-2.5 py-1 text-tm-xs font-semibold text-tm-fg-muted">
                {totalAgenda} {totalAgenda === 1 ? 'ficha' : 'fichas'}
              </span>
            )}
          </div>

          {loading ? (
            <AgendaSkeleton />
          ) : error ? (
            <EmptyState
              icon={<IconRefresh size={28} />}
              title="Não foi possível carregar a agenda"
              body={error}
              action={(
                <Button variant="secondary" icon={<IconRefresh size={16} />} onClick={() => void carregarAgenda()}>
                  Tentar novamente
                </Button>
              )}
            />
          ) : semAgenda ? (
            <EmptyState
              icon={<IconCalendar size={28} />}
              title="Nenhum atendimento programado"
              body="Sua agenda está livre por enquanto."
            />
          ) : (
            <div>
              {agenda.deHoje.length > 0 && (
                <section aria-labelledby="agenda-hoje">
                  <div className="flex items-center gap-2.5 border-b border-tm-border bg-tm-surface-2 px-4 py-2.5 sm:px-5">
                    <h3 id="agenda-hoje" className="text-tm-xs font-bold uppercase tracking-wider text-tm-fg-muted">
                      Hoje
                    </h3>
                    <span className="text-tm-xs text-tm-fg-subtle">{formatarData(hojeISO())}</span>
                    <span className="ml-auto text-tm-xs font-medium text-tm-fg-subtle">
                      {agenda.deHoje.length} {agenda.deHoje.length === 1 ? 'atendimento' : 'atendimentos'}
                    </span>
                  </div>
                  {agenda.deHoje.map((ficha) => (
                    <LinhaDaAgenda key={ficha.id} ficha={ficha} pacientes={pacientes} />
                  ))}
                </section>
              )}

              {agenda.proximas.length > 0 && (
                <section aria-labelledby="agenda-proximas">
                  <div className="flex items-center gap-2.5 border-b border-tm-border bg-tm-surface-2 px-4 py-2.5 sm:px-5">
                    <h3 id="agenda-proximas" className="text-tm-xs font-bold uppercase tracking-wider text-tm-fg-muted">
                      Próximos atendimentos
                    </h3>
                    <span className="ml-auto text-tm-xs font-medium text-tm-fg-subtle">Até 5 agendamentos</span>
                  </div>
                  {proximasPorData.map((grupo) => (
                    <div key={grupo.data}>
                      <div className="flex items-center gap-2.5 border-b border-tm-border px-4 py-2 sm:px-5">
                        <span className="text-tm-xs font-semibold text-tm-fg-muted">{formatarData(grupo.data)}</span>
                        <span className="h-px flex-1 bg-tm-border" />
                        <span className="text-tm-xs text-tm-fg-subtle">
                          {grupo.fichas.length} {grupo.fichas.length === 1 ? 'ficha' : 'fichas'}
                        </span>
                      </div>
                      {grupo.fichas.map((ficha) => (
                        <LinhaDaAgenda key={ficha.id} ficha={ficha} pacientes={pacientes} />
                      ))}
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
