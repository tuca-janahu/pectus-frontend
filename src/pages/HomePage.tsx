import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { FichaCard } from '../components/fichas/FichaCard'
import { IconArrowRight, IconCalendar, IconRefresh } from '../components/icons'
import { Button, Card, EmptyState, type AvatarColor } from '../components/ui'
import { listPacientes, type AuthUser, type PacienteResumo } from '../lib/api'
import { listFichas, type Ficha } from '../lib/fichasStore'

const AVATAR_COLORS: AvatarColor[] = ['sky', 'teal', 'violet', 'rose', 'amber']

function hojeISO(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function obterPrimeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] || 'usuário'
}

function obterSaudacao(user: AuthUser, date = new Date()): string {
  const hora = date.getHours()
  const cumprimento = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'
  const prefixo = user.roles.includes('MEDICO') ? 'Dr. ' : ''
  return `${cumprimento}, ${prefixo}${obterPrimeiroNome(user.nome)}.`
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

function FichaDaAgenda({ ficha, pacientes }: { ficha: Ficha; pacientes: PacienteResumo[] }) {
  const navigate = useNavigate()
  const paciente = pacientes.find((item) => item.id === ficha.pacienteId)

  return (
    <FichaCard
      ficha={ficha}
      pacienteNome={paciente?.nome ?? 'Paciente removido'}
      iniciais={paciente ? obterIniciais(paciente.nome) : '?'}
      avatarColor={AVATAR_COLORS[ficha.pacienteId % AVATAR_COLORS.length]}
      fotoUrl={paciente?.fotoUrl}
      onClick={() => navigate(`/fichas/${ficha.id}/editar`)}
    />
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

  if (!user) return null

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 text-tm-fg">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-tm-display text-tm-6xl font-bold tracking-[-0.03em]">{obterSaudacao(user)}</h1>
          <p className="mt-1 text-tm-md text-tm-fg-muted">Aqui está um resumo dos seus próximos atendimentos.</p>
        </div>
        <Button variant="secondary" iconRight={<IconArrowRight size={16} />} onClick={() => navigate('/fichas')}>
          Ver todas as fichas
        </Button>
      </header>

      {loading ? (
        <Card>
          <div className="flex min-h-36 items-center justify-center text-tm-md text-tm-fg-muted">
            Carregando sua agenda...
          </div>
        </Card>
      ) : error ? (
        <Card>
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
        </Card>
      ) : semAgenda ? (
        <Card>
          <EmptyState
            icon={<IconCalendar size={28} />}
            title="Nenhum atendimento programado"
            body="Sua agenda está livre por enquanto."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-2">
          {agenda.deHoje.length > 0 && (
            <section className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-tm-2xl font-bold tracking-[-0.01em]">Hoje</h2>
                  <p className="mt-0.5 text-tm-sm text-tm-fg-muted">{formatarData(hojeISO())}</p>
                </div>
                <span className="ml-auto rounded-full bg-tm-accent-primary-bg px-2.5 py-1 text-tm-sm font-semibold text-tm-accent-primary-fg">
                  {agenda.deHoje.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {agenda.deHoje.map((ficha) => (
                  <FichaDaAgenda key={ficha.id} ficha={ficha} pacientes={pacientes} />
                ))}
              </div>
            </section>
          )}

          {agenda.proximas.length > 0 && (
            <section className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-tm-2xl font-bold tracking-[-0.01em]">Próximas</h2>
                  <p className="mt-0.5 text-tm-sm text-tm-fg-muted">Seus próximos atendimentos agendados</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {proximasPorData.map((grupo) => (
                  <div key={grupo.data} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-tm-sm font-semibold text-tm-fg-muted">
                      <span>{formatarData(grupo.data)}</span>
                      <span className="h-px flex-1 bg-tm-border" />
                    </div>
                    {grupo.fichas.map((ficha) => (
                      <FichaDaAgenda key={ficha.id} ficha={ficha} pacientes={pacientes} />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
