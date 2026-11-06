import { useCallback, useEffect, useMemo, useState } from 'react'
import { matchPath, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Card, EmptyState } from '../components/ui'
import type { AvatarColor } from '../components/ui'
import { IconCalendar, IconList, IconPlus } from '../components/icons'
import { AtendimentoCard } from '../components/atendimentos/AtendimentoCard'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { AtendimentoForm } from '../components/atendimentos/AtendimentoForm'
import { useAuth } from '../auth/AuthContext'
import { listPacientes, ApiError, type PacienteResumo } from '../lib/api'
import { listAtendimentos, cancelarAtendimento, iniciarAtendimento, type Atendimento } from '../lib/atendimentosStore'
import { toastError, toastSuccess } from '../lib/toast'

const AVATAR_COLORS: AvatarColor[] = ['sky', 'teal', 'violet', 'rose', 'amber']
const MESES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return '?'
}

function hojeISO(): string {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

function formatarDataLonga(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} de ${MESES_PT[m - 1]} de ${y}`
}

function diaRelativo(iso: string): string | null {
  const [y, m, d] = iso.split('-').map(Number)
  const [hy, hm, hd] = hojeISO().split('-').map(Number)
  const diff = Math.round((new Date(y, m - 1, d).getTime() - new Date(hy, hm - 1, hd).getTime()) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'
  if (diff > 1 && diff < 7) return `Em ${diff} dias`
  if (diff < 0 && diff > -7) return `${-diff} dias atrás`
  return null
}

type Filtro = 'todas' | 'agendada' | 'pendente' | 'concluida' | 'cancelada'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'agendada', label: 'Agendadas' },
  { id: 'pendente', label: 'Em preenchimento' },
  { id: 'concluida', label: 'Concluídos' },
  { id: 'cancelada', label: 'Cancelados' },
]

export interface AtendimentosPageProps {
  onCountChange?: (count: number) => void
}

export function AtendimentosPage({ onCountChange }: AtendimentosPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { accessToken, user } = useAuth()

  const statusParam = new URLSearchParams(location.search).get('status')
  const filtroInicial: Filtro = statusParam === 'CONCLUIDA' ? 'concluida' : statusParam === 'CANCELADA' ? 'cancelada' : statusParam === 'AGENDADA' ? 'agendada' : statusParam === 'EM_PREENCHIMENTO' ? 'pendente' : 'todas'
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial)

  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Atendimento | null>(null)

  const pathname = location.pathname.replace(/\/+$/, '') || '/'
  const editMatch = matchPath('/atendimentos/:id/editar', pathname) ?? matchPath('/atendimentos/editar/:id', pathname)
  const editingId = editMatch ? Number(editMatch.params.id) : undefined
  const editingAtendimento = editingId ? atendimentos.find((atendimento) => atendimento.id === editingId) : undefined
  const searchParams = new URLSearchParams(location.search)
  const pacienteIdParam = Number(searchParams.get('pacienteId'))
  const pacienteIdInicial = Number.isInteger(pacienteIdParam) && pacienteIdParam > 0 ? pacienteIdParam : undefined
  const dataParam = searchParams.get('data')
  const dataInicial = dataParam && /^\d{4}-\d{2}-\d{2}$/.test(dataParam) ? dataParam : undefined
  const retornoParam = searchParams.get('retorno')
  const retorno = retornoParam?.startsWith('/pacientes/') || retornoParam === '/calendario' ? retornoParam : '/atendimentos'

  const carregarAtendimentos = useCallback(async () => {
    if (!accessToken) return
    const query = new URLSearchParams(location.search)
    const de = query.get('de')
    const ate = query.get('ate')
    const medicoId = Number(query.get('medicoId'))
    const lista = await listAtendimentos(accessToken, {
      de: de && /^\d{4}-\d{2}-\d{2}$/.test(de) ? de : undefined,
      ate: ate && /^\d{4}-\d{2}-\d{2}$/.test(ate) ? ate : undefined,
      medicoId: Number.isInteger(medicoId) && medicoId > 0 ? medicoId : undefined,
    })
    setAtendimentos(lista)
    onCountChange?.(lista.length)
  }, [accessToken, onCountChange, location.search])

  const carregarPacientes = useCallback(async () => {
    if (!accessToken) return
    try {
      const { pacientes: lista } = await listPacientes(accessToken, undefined, true)
      setPacientes(lista)
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : 'Não foi possível carregar os pacientes.')
    }
  }, [accessToken])

  useEffect(() => {
    setLoading(true)
    Promise.all([carregarAtendimentos(), carregarPacientes()]).finally(() => setLoading(false))
  }, [carregarAtendimentos, carregarPacientes])

  const grouped = useMemo(() => {
    const filtered = atendimentos.filter((f) => filtro === 'todas' || f.status === filtro)
    const map = new Map<string, Atendimento[]>()
    filtered.forEach((f) => {
      if (!map.has(f.data)) map.set(f.data, [])
      map.get(f.data)!.push(f)
    })
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([data, items]) => ({ data, items: items.sort((a, b) => a.hora.localeCompare(b.hora)) }))
  }, [atendimentos, filtro])

  const openCreate = () => {
    navigate('/atendimentos/novo')
  }

  const openEdit = (atendimento: Atendimento) => {
    navigate(`/atendimentos/${atendimento.id}/editar`)
  }

  const handleStart = async (atendimento: Atendimento) => {
    if (!accessToken || startingId !== null) return
    setStartingId(atendimento.id)
    try {
      const iniciado = await iniciarAtendimento(accessToken, atendimento.id)
      setAtendimentos((atuais) => atuais.map((item) => item.id === iniciado.id ? iniciado : item))
      toastSuccess('Atendimento iniciado. Preencha a ficha clínica.')
      openEdit(atendimento)
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Não foi possível iniciar o atendimento.')
      await carregarAtendimentos()
    } finally {
      setStartingId(null)
    }
  }

  const handleDelete = async () => {
    try {
      if (!accessToken || !cancelTarget) return
      await cancelarAtendimento(accessToken, cancelTarget.id)
      setCancelTarget(null)
      toastSuccess('Atendimento cancelado.')
      await carregarAtendimentos()
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Não foi possível cancelar o atendimento.')
    }
  }

  const backToList = () => {
    navigate(retorno)
  }

  const handleSaved = async () => {
    await Promise.all([
    carregarAtendimentos(),
    carregarPacientes(),
  ])
    backToList()
  }

  if (pathname === '/atendimentos/novo') {
    return <AtendimentoForm pacienteIdInicial={pacienteIdInicial} dataInicial={dataInicial} onCancel={backToList} onSuccess={handleSaved} />
  }

  if (pathname === '/atendimentos/nova' || pathname.startsWith('/atendimentos/nova/')) {
    return <Navigate to={`/atendimentos/novo${location.search}`} replace />
  }

  if (editMatch) {
    if (loading) {
        return <div className="py-4 text-tm-sm text-tm-fg-muted">Carregando atendimento...</div>
    }

    if (!editingAtendimento) {
      return <Navigate to="/atendimentos" replace />
    }

    return <AtendimentoForm atendimento={editingAtendimento} onCancel={backToList} onSuccess={handleSaved}
      onStarted={(iniciado) => setAtendimentos((atuais) => atuais.map((item) => item.id === iniciado.id ? iniciado : item))} />
  }

  if (pathname !== '/atendimentos') {
    return <Navigate to="/atendimentos" replace />
  }

  return (
    <div className="flex flex-col gap-5 text-tm-fg">
      <div className="flex max-w-full flex-wrap gap-1.5 self-start rounded-tm-button border border-tm-border bg-tm-surface-2 p-1">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`rounded-tm-sm px-3.5 py-2 text-tm-sm font-semibold transition-all  ${
              filtro === f.id ? 'bg-tm-surface text-tm-primary-deep shadow-tm-card' : 'text-tm-fg-muted cursor-pointer'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Card style={{ padding: 14, cursor: 'pointer' }} onClick={openCreate}>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-tm-sm bg-tm-primary text-white">
              <IconPlus size={20} />
            </div>
            <div className="text-tm-md font-semibold text-tm-fg">Novo atendimento</div>
          </div>
        </Card>
        <Card style={{ padding: 14, cursor: 'pointer' }} onClick={() => navigate('/calendario')}>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-tm-sm bg-tm-accent-primary-bg text-tm-accent-primary-fg">
              <IconCalendar size={20} />
            </div>
            <div className="text-tm-md font-semibold text-tm-fg">Ver no calendário</div>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="py-4 text-tm-sm text-tm-fg-muted">Carregando atendimentos...</div>
      ) : grouped.length === 0 ? (
        <Card>
          <EmptyState icon={<IconList size={28} />} title="Nenhum atendimento encontrado" body="Tente trocar o filtro ou crie um novo atendimento." />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(({ data, items }) => {
            const rel = diaRelativo(data)
            return (
              <section key={data}>
                <div className="mb-2.5 flex items-center gap-2.5">
                  <div className="text-tm-md font-bold tracking-[-0.005em] text-tm-fg">{formatarDataLonga(data)}</div>
                  {rel && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-tm-xs font-semibold ${
                        data === hojeISO() ? 'bg-tm-primary text-white' : 'bg-tm-surface-2 text-tm-fg-muted'
                      }`}
                    >
                      {rel}
                    </span>
                  )}
                  <div className="h-px flex-1 bg-tm-border" />
                  <span className="text-tm-sm text-tm-fg-subtle">
                    {items.length} {items.length === 1 ? 'atendimento' : 'atendimentos'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((f) => {
                    const p = pacientes.find((x) => x.id === f.pacienteId)
                    return (
                      <AtendimentoCard
                        key={f.id}
                        atendimento={f}
                        pacienteNome={p?.nome ?? 'Paciente removido'}
                        iniciais={p ? obterIniciais(p.nome) : '?'}
                        avatarColor={AVATAR_COLORS[f.pacienteId % AVATAR_COLORS.length]}
                        fotoUrl={p?.fotoUrl}
                        onClick={(f.status === 'concluida' && user?.roles.includes('MEDICO')) || ((f.status === 'agendada' || f.status === 'pendente') && (user?.roles.includes('ADMIN') || user?.medico?.id === f.medicoId)) ? () => openEdit(f) : undefined}
                        onEdit={(f.status === 'concluida' && user?.roles.includes('MEDICO')) || ((f.status === 'agendada' || f.status === 'pendente') && (user?.roles.includes('ADMIN') || user?.medico?.id === f.medicoId)) ? () => openEdit(f) : undefined}
                         onDelete={(f.status === 'agendada' || f.status === 'pendente') && (user?.roles.includes('ADMIN') || user?.medico?.id === f.medicoId) ? () => setCancelTarget(f) : undefined}
                         onStart={f.status === 'agendada' && user?.roles.includes('MEDICO') && user.medico?.id === f.medicoId ? () => handleStart(f) : undefined}
                         starting={startingId === f.id}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
      <ConfirmDialog open={!!cancelTarget} title="Cancelar atendimento?"
        description="O cancelamento é definitivo. Para atender o paciente depois, será necessário criar outro agendamento."
        confirmLabel="Cancelar atendimento" onCancel={() => setCancelTarget(null)} onConfirm={handleDelete} />
    </div>
  )
}
