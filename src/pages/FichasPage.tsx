import { useCallback, useEffect, useMemo, useState } from 'react'
import { matchPath, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Card, EmptyState } from '../components/ui'
import type { AvatarColor } from '../components/ui'
import { IconCalendar, IconList, IconPlus } from '../components/icons'
import { FichaCard } from '../components/fichas/FichaCard'
import { NovaFichaChooser } from '../components/fichas/NovaFichaChooser'
import { FichaForm } from '../components/fichas/FichaForm'
import { FichaAoVivo } from '../components/fichas/FichaAoVivo'
import { useAuth } from '../auth/AuthContext'
import { listPacientes, ApiError, type PacienteResumo } from '../lib/api'
import { listFichas, deleteFicha, type Ficha } from '../lib/fichasStore'
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

type Filtro = 'todas' | 'agendada' | 'concluida'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'agendada', label: 'Agendadas' },
  { id: 'concluida', label: 'Concluídas' },
]

export interface FichasPageProps {
  onCountChange?: (count: number) => void
}

export function FichasPage({ onCountChange }: FichasPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { accessToken } = useAuth()

  const [filtro, setFiltro] = useState<Filtro>('todas')

  const [fichas, setFichas] = useState<Ficha[]>([])
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [loading, setLoading] = useState(true)

  const pathname = location.pathname.replace(/\/+$/, '') || '/'
  const editMatch = matchPath('/fichas/:id/editar', pathname)
  const editingId = editMatch ? Number(editMatch.params.id) : undefined
  const editingFicha = editingId ? fichas.find((ficha) => ficha.id === editingId) : undefined
  const searchParams = new URLSearchParams(location.search)
  const pacienteIdParam = Number(searchParams.get('pacienteId'))
  const pacienteIdInicial = Number.isInteger(pacienteIdParam) && pacienteIdParam > 0 ? pacienteIdParam : undefined
  const retornoParam = searchParams.get('retorno')
  const retorno = retornoParam?.startsWith('/pacientes/') ? retornoParam : '/fichas'

  const carregarFichas = useCallback(async () => {
    if (!accessToken) return
    const lista = await listFichas(accessToken)
    setFichas(lista)
    onCountChange?.(lista.length)
  }, [accessToken, onCountChange])

  const carregarPacientes = useCallback(async () => {
    if (!accessToken) return
    try {
      const { pacientes: lista } = await listPacientes(accessToken)
      setPacientes(lista)
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : 'Não foi possível carregar os pacientes.')
    }
  }, [accessToken])

  useEffect(() => {
    setLoading(true)
    Promise.all([carregarFichas(), carregarPacientes()]).finally(() => setLoading(false))
  }, [carregarFichas, carregarPacientes])

  const grouped = useMemo(() => {
    const filtered = fichas.filter((f) => filtro === 'todas' || f.status === filtro)
    const map = new Map<string, Ficha[]>()
    filtered.forEach((f) => {
      if (!map.has(f.data)) map.set(f.data, [])
      map.get(f.data)!.push(f)
    })
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([data, items]) => ({ data, items: items.sort((a, b) => a.hora.localeCompare(b.hora)) }))
  }, [fichas, filtro])

  const openCreate = () => {
    navigate('/fichas/nova')
  }

  const openEdit = (ficha: Ficha) => {
    navigate(`/fichas/${ficha.id}/editar`)
  }

  const handleDelete = async (ficha: Ficha) => {
    try {
      if (!accessToken) return
      await deleteFicha(accessToken, ficha.id)
      toastSuccess('Ficha cancelada.')
      await carregarFichas()
    } catch {
      toastError('Não foi possível excluir a ficha.')
    }
  }

  const backToList = () => {
    navigate(retorno)
  }

  const handleSaved = async () => {
    await carregarFichas()
    backToList()
  }

  if (pathname === '/fichas/nova') {
    return (
      <NovaFichaChooser
        onChoose={(id) => navigate(`${id === 'form' ? '/fichas/nova/agendamento' : '/fichas/nova/atendimento'}${location.search}`)}
      />
    )
  }

  if (pathname === '/fichas/nova/agendamento') {
    return <FichaForm pacienteIdInicial={pacienteIdInicial} onCancel={backToList} onSuccess={handleSaved} />
  }

  if (pathname === '/fichas/nova/atendimento') {
    return <FichaAoVivo pacienteIdInicial={pacienteIdInicial} onCancel={backToList} onSuccess={handleSaved} />
  }

  if (editMatch) {
    if (loading) {
      return <div className="py-4 text-tm-sm text-tm-fg-muted">Carregando ficha...</div>
    }

    if (!editingFicha) {
      return <Navigate to="/fichas" replace />
    }

    return <FichaForm ficha={editingFicha} onCancel={backToList} onSuccess={handleSaved} />
  }

  if (pathname !== '/fichas') {
    return <Navigate to="/fichas" replace />
  }

  return (
    <div className="flex flex-col gap-5 text-tm-fg">
      <div className="inline-flex gap-1.5 self-start rounded-tm-button border border-tm-border bg-tm-surface-2 p-1">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`rounded-tm-sm px-3.5 py-2 text-tm-sm font-semibold transition-all ${
              filtro === f.id ? 'bg-tm-surface text-tm-primary-deep shadow-tm-card' : 'text-tm-fg-muted'
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
            <div className="text-tm-md font-semibold text-tm-fg">Nova ficha</div>
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
        <div className="py-4 text-tm-sm text-tm-fg-muted">Carregando fichas...</div>
      ) : grouped.length === 0 ? (
        <Card>
          <EmptyState icon={<IconList size={28} />} title="Nenhuma ficha encontrada" body="Tente trocar o filtro ou crie uma nova ficha." />
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
                    {items.length} {items.length === 1 ? 'ficha' : 'fichas'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((f) => {
                    const p = pacientes.find((x) => x.id === f.pacienteId)
                    return (
                      <FichaCard
                        key={f.id}
                        ficha={f}
                        pacienteNome={p?.nome ?? 'Paciente removido'}
                        iniciais={p ? obterIniciais(p.nome) : '?'}
                        avatarColor={AVATAR_COLORS[f.pacienteId % AVATAR_COLORS.length]}
                        fotoUrl={p?.fotoUrl}
                        onClick={f.status === 'agendada' || f.status === 'pendente' ? () => openEdit(f) : undefined}
                        onEdit={f.status === 'agendada' || f.status === 'pendente' ? () => openEdit(f) : undefined}
                        onDelete={f.status === 'agendada' || f.status === 'pendente' ? () => handleDelete(f) : undefined}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
