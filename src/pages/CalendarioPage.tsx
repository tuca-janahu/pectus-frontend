import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { useAuth } from '../auth/AuthContext'
import {
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconGoogle,
  IconPlus,
} from '../components/icons'
import { Button, Card, EmptyState, type AvatarColor } from '../components/ui'
import { AtendimentoCard } from '../components/atendimentos/AtendimentoCard'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import {
  ApiError,
  connectGoogleCalendar,
  getGoogleCalendarStatus,
  listPacientes,
  type AuthUser,
  type PacienteResumo,
} from '../lib/api'
import { cancelarAtendimento, iniciarAtendimento, listAtendimentos, type Atendimento } from '../lib/atendimentosStore'
import { toastError, toastSuccess } from '../lib/toast'

const AVATAR_COLORS: AvatarColor[] = ['sky', 'teal', 'violet', 'rose', 'amber']
const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const MESES_CURTOS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

function hojeISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatarDataResumo(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  return `${dia} de ${MESES[mes - 1].toLowerCase()} de ${ano}`
}

function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return '?'
}

function filtrarAtendimentosUsuario(atendimentos: Atendimento[], user: AuthUser): Atendimento[] {
  if (user.roles.includes('MEDICO') && user.medico) {
    return atendimentos.filter((f) => f.medicoId === user.medico?.id)
  }
  return atendimentos
}

interface DiaGrade {
  dataISO: string
  diaNumero: number
  mesAtual: boolean
  isHoje: boolean
  atendimentos: Atendimento[]
}

function gerarDiasDoMes(ano: number, mes: number, atendimentos: Atendimento[], hojeStr: string): DiaGrade[] {
  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)
  const dias: DiaGrade[] = []

  // Dias do mês anterior para completar a primeira semana
  const diaSemanaInicio = primeiroDia.getDay()
  const ultimoDiaMesAnterior = new Date(ano, mes, 0).getDate()
  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    const diaNum = ultimoDiaMesAnterior - i
    const d = new Date(ano, mes - 1, diaNum)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dias.push({
      dataISO: iso,
      diaNumero: diaNum,
      mesAtual: false,
      isHoje: iso === hojeStr,
      atendimentos: atendimentos.filter((f) => f.data === iso),
    })
  }

  // Dias do mês atual
  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const iso = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    dias.push({
      dataISO: iso,
      diaNumero: dia,
      mesAtual: true,
      isHoje: iso === hojeStr,
      atendimentos: atendimentos.filter((f) => f.data === iso),
    })
  }

  // Dias do próximo mês para fechar as semanas
  const restante = (7 - (dias.length % 7)) % 7
  for (let dia = 1; dia <= restante; dia++) {
    const d = new Date(ano, mes + 1, dia)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dias.push({
      dataISO: iso,
      diaNumero: dia,
      mesAtual: false,
      isHoje: iso === hojeStr,
      atendimentos: atendimentos.filter((f) => f.data === iso),
    })
  }

  return dias
}

export function CalendarioPage() {
  const { user, accessToken } = useAuth()
  const navigate = useNavigate()

  // Google Calendar status e conexão
  const [conectado, setConectado] = useState<boolean | null>(null)
  const [verificandoStatus, setVerificandoStatus] = useState(true)
  const [conectando, setConectando] = useState(false)

  // Atendimentos e pacientes da API
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [loadingAgenda, setLoadingAgenda] = useState(true)
  const [startingId, setStartingId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Atendimento | null>(null)

  // Mês, ano e seleção
  const hoje = hojeISO()
  const dataHoje = new Date()
  const [anoAtual, setAnoAtual] = useState(dataHoje.getFullYear())
  const [mesAtual, setMesAtual] = useState(dataHoje.getMonth()) // 0-indexed
  const [diaSelecionado, setDiaSelecionado] = useState<string>(hoje)

  // Seletor Dropdown de Mês/Ano
  const [seletorAberto, setSeletorAberto] = useState(false)
  const [anoSeletor, setAnoSeletor] = useState(anoAtual)
  const seletorRef = useRef<HTMLDivElement>(null)

  // Fecha seletor ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (seletorRef.current && !seletorRef.current.contains(event.target as Node)) {
        setSeletorAberto(false)
      }
    }
    if (seletorAberto) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [seletorAberto])

  // Mantém ano do seletor alinhado quando o anoAtual muda
  useEffect(() => {
    setAnoSeletor(anoAtual)
  }, [anoAtual])

  // 1. Checagem do status do Google Calendar via GET /auth/google/calendar-status
  const checarStatusCalendar = useCallback(async () => {
    if (!accessToken) return
    try {
      setVerificandoStatus(true)
      const res = await getGoogleCalendarStatus(accessToken)
      setConectado(Boolean(res.conectado))
    } catch {
      setConectado(false)
    } finally {
      setVerificandoStatus(false)
    }
  }, [accessToken])

  useEffect(() => {
    void checarStatusCalendar()
  }, [checarStatusCalendar])

  // 2. Disparo OAuth2 com escopo calendar.events, access_type offline e prompt consent
  const dispararOAuthCalendar = useGoogleLogin({
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    ...({
      prompt: 'consent',
      access_type: 'offline',
    } as Record<string, unknown>),
    onSuccess: async (codeResponse) => {
      if (!accessToken) return
      setConectando(true)
      try {
        await connectGoogleCalendar(accessToken, codeResponse.code)
        toastSuccess('Google Agenda conectada com sucesso!')
        setConectado(true)
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Não foi possível conectar ao Google Agenda.'
        toastError(msg)
      } finally {
        setConectando(false)
      }
    },
    onError: () => {
      setConectando(false)
      toastError('Conexão com o Google Agenda cancelada ou indisponível.')
    },
  })

  // 3. SINCRONIZAÇÃO DE HISTÓRICO: Busca dados da API
  const carregarDados = useCallback(async () => {
    if (!accessToken) return
    setLoadingAgenda(true)
    try {
      const [atendimentosRes, pacientesRes] = await Promise.all([
        listAtendimentos(accessToken),
        listPacientes(accessToken, undefined, true),
      ])
      setAtendimentos(atendimentosRes)
      setPacientes(pacientesRes.pacientes)
    } catch {
      // falhas tratadas graciosamente
    } finally {
      setLoadingAgenda(false)
    }
  }, [accessToken])

  // Sincroniza sempre que mês ou ano mudam
  useEffect(() => {
    void carregarDados()
  }, [carregarDados, anoAtual, mesAtual])

  // Ao navegar, mantém o dia selecionado quando possível e limita ao último dia do novo mês.
  const mudarMes = (ano: number, mes: number) => {
    const data = new Date(ano, mes, 1)
    const novoAno = data.getFullYear()
    const novoMes = data.getMonth()
    const dia = Math.min(Number(diaSelecionado.slice(8, 10)), new Date(novoAno, novoMes + 1, 0).getDate())
    setAnoAtual(novoAno)
    setMesAtual(novoMes)
    setDiaSelecionado(`${novoAno}-${String(novoMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`)
  }

  const irMesAnterior = () => mudarMes(anoAtual, mesAtual - 1)
  const irProximoMes = () => mudarMes(anoAtual, mesAtual + 1)

  const irParaHoje = () => {
    const d = new Date()
    setAnoAtual(d.getFullYear())
    setMesAtual(d.getMonth())
    setDiaSelecionado(hojeISO())
  }

  const selecionarMesAno = (m: number, a: number) => {
    mudarMes(a, m)
    setSeletorAberto(false)
  }

  const handleEdit = (atendimento: Atendimento) => {
    navigate(`/atendimentos/${atendimento.id}/editar?retorno=/calendario`)
  }

  const handleStart = async (atendimento: Atendimento) => {
    if (!accessToken || startingId !== null) return
    setStartingId(atendimento.id)
    try {
      await iniciarAtendimento(accessToken, atendimento.id)
      toastSuccess('Atendimento iniciado. Preencha a ficha clínica.')
      handleEdit(atendimento)
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Não foi possível iniciar o atendimento.')
      await carregarDados()
    } finally {
      setStartingId(null)
    }
  }

  const handleDelete = async () => {
    if (!cancelTarget) return
    try {
      if (!accessToken) return
      await cancelarAtendimento(accessToken, cancelTarget.id)
      setCancelTarget(null)
      toastSuccess('Atendimento cancelado com sucesso.')
      await carregarDados()
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Não foi possível cancelar o atendimento.')
    }
  }

  const atendimentosFiltrados = useMemo(() => {
    return user ? filtrarAtendimentosUsuario(atendimentos, user) : []
  }, [atendimentos, user])

  const diasGrade = useMemo(() => {
    return gerarDiasDoMes(anoAtual, mesAtual, atendimentosFiltrados, hoje)
  }, [anoAtual, mesAtual, atendimentosFiltrados, hoje])

  // Atendimentos do dia selecionado
  const atendimentosDoDiaSelecionado = useMemo(() => {
    return atendimentosFiltrados
      .filter((f) => f.data === diaSelecionado)
      .sort((a, b) => a.hora.localeCompare(b.hora))
  }, [atendimentosFiltrados, diaSelecionado])

  const totalAtendimentosDia = atendimentosDoDiaSelecionado.length
  const textoTotalAtendimentos =
    totalAtendimentosDia === 0
      ? 'Nenhum atendimento neste dia'
      : `${totalAtendimentosDia} ${totalAtendimentosDia === 1 ? 'atendimento' : 'atendimentos'} neste dia`

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 text-tm-fg">
      {/* 1. CARD NO TOPO: Integrar com o Google Agenda (Apenas quando desconectado) */}
      {!verificandoStatus && conectado === false && (
        <Card
          padded={false}
          style={{
            overflow: 'hidden',
            borderColor: 'color-mix(in oklch, var(--tm-primary) 35%, var(--tm-border))',
          }}
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-tm-card border border-tm-border bg-tm-surface-2 text-tm-fg">
                <IconGoogle size={26} />
              </div>
              <div className="min-w-0">
                <h2 className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">
                  Integrar com o Google Agenda
                </h2>
                <p className="mt-0.5 text-tm-sm text-tm-fg-muted">
                  Veja e sincronize os atendimentos direto na sua agenda do Google.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="md"
              icon={<IconGoogle size={20} />}
              onClick={() => {
                setConectando(true)
                dispararOAuthCalendar()
              }}
              disabled={conectando}
              className="shrink-0"
            >
              {conectando ? 'Conectando...' : 'Conectar'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)]">
      <div className="min-w-0">
      <Card padded={false} style={{ overflow: 'visible' }}>
        <div className="rounded-tm-card">
          {/* BLOCO AZUL: Ano, Mês com seletor interativo e navegação */}
          <div className="relative flex items-center justify-between rounded-t-tm-card bg-[linear-gradient(135deg,var(--tm-primary)_0%,var(--tm-primary-deep)_100%)] p-3 text-white">
            {/* Lado Esquerdo: Mês e Ano com Seletor Interativo */}
            <div className="relative" ref={seletorRef}>
              <button
                type="button"
                onClick={() => setSeletorAberto((s) => !s)}
                className="group flex items-center gap-2 rounded-tm-button px-2.5 py-1.5 -ml-2.5 transition-all hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
                aria-expanded={seletorAberto}
                aria-haspopup="dialog"
                title="Clique para selecionar outro mês e ano"
              >
                <div className="flex flex-col text-left">
                  <span className="text-tm-xs font-semibold uppercase tracking-wider text-white/80">
                    {anoAtual}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-tm-2xl font-bold tracking-tight text-white sm:text-tm-3xl">
                      {MESES[mesAtual]}
                    </span>
                    <IconChevronDown
                      size={20}
                      className={`text-white/80 transition-transform duration-200 group-hover:text-white ${
                        seletorAberto ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </button>

              {/* POPUP / SELETOR RÁPIDO DE MÊS E ANO */}
              {seletorAberto && (
                <div className="absolute left-0 top-full z-30 mt-2 w-[280px] rounded-tm-card border border-tm-border bg-tm-surface p-4 shadow-lg sm:w-[320px] text-tm-fg animate-in fade-in zoom-in-95 duration-150">
                  {/* Seletor de Ano */}
                  <div className="mb-3 flex items-center justify-between border-b border-tm-border pb-2.5">
                    <button
                      type="button"
                      onClick={() => setAnoSeletor((a) => a - 1)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-tm-button text-tm-fg-muted transition-colors hover:bg-tm-surface-2 hover:text-tm-fg"
                      aria-label="Ano anterior"
                    >
                      <IconChevronLeft size={18} />
                    </button>
                    <span className="text-tm-lg font-bold text-tm-fg">{anoSeletor}</span>
                    <button
                      type="button"
                      onClick={() => setAnoSeletor((a) => a + 1)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-tm-button text-tm-fg-muted transition-colors hover:bg-tm-surface-2 hover:text-tm-fg"
                      aria-label="Próximo ano"
                    >
                      <IconChevronRight size={18} />
                    </button>
                  </div>

                  {/* Grade de 12 Meses */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {MESES_CURTOS.map((nomeCurto, index) => {
                      const isMesAtivo = mesAtual === index && anoAtual === anoSeletor
                      return (
                        <button
                          key={nomeCurto}
                          type="button"
                          onClick={() => selecionarMesAno(index, anoSeletor)}
                          className={`cursor-pointer rounded-tm-button py-2 text-center text-tm-sm font-semibold transition-colors ${
                            isMesAtivo
                              ? 'bg-tm-primary text-white shadow-tm-card'
                              : 'text-tm-fg hover:bg-tm-surface-2'
                          }`}
                        >
                          {nomeCurto}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Lado Direito: Setas de navegação direta */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={irMesAnterior}
                aria-label="Mês anterior"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-tm-button border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/30"
              >
                <IconChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={irProximoMes}
                aria-label="Próximo mês"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-tm-button border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/30"
              >
                <IconChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* CABEÇALHO DA GRELHA (DOM, SEG, TER...) */}
          <div className="grid grid-cols-7 border-b border-tm-border bg-tm-surface-2 text-center text-tm-xs font-bold uppercase tracking-wider text-tm-fg-muted">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="py-1.5">
                {dia}
              </div>
            ))}
          </div>

          {/* GRELHA MENSAL COM BADGE NUMÉRICO CIRCULAR DE NOTIFICAÇÃO */}
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-b-tm-card bg-tm-border">
            {diasGrade.map((dia) => {
              const isSelecionado = dia.dataISO === diaSelecionado
              const quantidadeConsultas = dia.atendimentos.length

              return (
                <button
                  key={dia.dataISO}
                  type="button"
                  aria-label={`${formatarDataResumo(dia.dataISO)}, ${quantidadeConsultas} ${quantidadeConsultas === 1 ? 'atendimento' : 'atendimentos'}`}
                  aria-pressed={isSelecionado}
                  onClick={() => setDiaSelecionado(dia.dataISO)}
                  className={`relative flex min-h-[48px] w-full cursor-pointer flex-col items-center justify-center p-1 transition-colors focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-tm-primary sm:min-h-[56px] ${
                    dia.mesAtual ? 'bg-tm-surface' : 'bg-tm-surface-2/40 text-tm-fg-subtle'
                  } ${
                    isSelecionado
                      ? 'ring-2 ring-inset ring-tm-primary bg-[color-mix(in_oklch,var(--tm-primary)_9%,var(--tm-surface))] z-10'
                      : 'hover:bg-tm-surface-2'
                  }`}
                >
                  {/* Badge numérico circular de notificação com cor idêntica ao sino do sistema */}
                  {quantidadeConsultas > 0 && (
                    <span
                      className="absolute right-1 top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-tm-badge-count-bg px-1 text-[10px] font-bold text-white shadow-tm-card"
                      aria-hidden="true"
                      title={`${quantidadeConsultas} atendimento(s) no dia`}
                    >
                      {quantidadeConsultas}
                    </span>
                  )}

                  {/* Número do Dia */}
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-tm-sm font-semibold ${
                      dia.isHoje
                        ? 'bg-tm-primary text-white shadow-tm-card'
                        : isSelecionado
                          ? 'font-bold text-tm-primary text-tm-base'
                          : dia.mesAtual
                            ? 'text-tm-fg'
                            : 'text-tm-fg-subtle opacity-40'
                    }`}
                  >
                    {dia.diaNumero}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </Card>
      </div>

      <section aria-label="Atendimentos do dia selecionado" className="flex min-w-0 flex-col overflow-hidden rounded-tm-card border border-tm-border bg-tm-surface shadow-tm-card xl:max-h-[445px]">
      <div className="shrink-0 border-b border-tm-border p-3">
        <div className="min-w-0">
          <h3 className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">
            {formatarDataResumo(diaSelecionado)}
          </h3>
          <p className="mt-0.5 text-tm-sm font-medium text-tm-fg-muted">
            {textoTotalAtendimentos}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={irParaHoje}>
            Hoje
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<IconPlus size={16} />}
            onClick={() => navigate(`/atendimentos/novo?data=${diaSelecionado}`)}
          >
            Novo agendamento
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-2.5 overflow-y-auto p-3 xl:flex-1">
        {loadingAgenda ? (
            <div className="py-8 text-center text-tm-sm text-tm-fg-muted">
              Carregando agendamentos...
            </div>
        ) : atendimentosDoDiaSelecionado.length === 0 ? (
            <EmptyState
              icon={<IconCalendar size={28} />}
              title="Nenhum atendimento neste dia"
              body="Não há atendimentos registrados para este dia."
              action={
                <Button
                  size="sm"
                  icon={<IconPlus size={16} />}
                  onClick={() => navigate(`/atendimentos/novo?data=${diaSelecionado}`)}
                >
                  Agendar paciente
                </Button>
              }
            />
        ) : (
          atendimentosDoDiaSelecionado.map((atendimento) => {
            const paciente = pacientes.find((p) => p.id === atendimento.pacienteId)
            return (
              <AtendimentoCard
                key={atendimento.id}
                atendimento={atendimento}
                pacienteNome={paciente?.nome ?? `Paciente #${atendimento.pacienteId}`}
                iniciais={paciente ? obterIniciais(paciente.nome) : '?'}
                avatarColor={AVATAR_COLORS[atendimento.pacienteId % AVATAR_COLORS.length]}
                fotoUrl={paciente?.fotoUrl}
                onClick={(atendimento.status === 'concluida' && user?.roles.includes('MEDICO')) || ((atendimento.status === 'agendada' || atendimento.status === 'pendente') && (user?.roles.includes('ADMIN') || user?.medico?.id === atendimento.medicoId)) ? () => handleEdit(atendimento) : undefined}
                onEdit={(atendimento.status === 'concluida' && user?.roles.includes('MEDICO')) || ((atendimento.status === 'agendada' || atendimento.status === 'pendente') && (user?.roles.includes('ADMIN') || user?.medico?.id === atendimento.medicoId)) ? () => handleEdit(atendimento) : undefined}
                onDelete={(atendimento.status === 'agendada' || atendimento.status === 'pendente') && (user?.roles.includes('ADMIN') || user?.medico?.id === atendimento.medicoId) ? () => setCancelTarget(atendimento) : undefined}
                onStart={atendimento.status === 'agendada' && user?.roles.includes('MEDICO') && user.medico?.id === atendimento.medicoId ? () => handleStart(atendimento) : undefined}
                starting={startingId === atendimento.id}
              />
            )
          })
        )}
      </div>
      </section>
      </div>
      <ConfirmDialog open={!!cancelTarget} title="Cancelar atendimento?"
        description="O cancelamento é definitivo. Para atender o paciente depois, será necessário criar outro agendamento."
        confirmLabel="Cancelar atendimento" onCancel={() => setCancelTarget(null)} onConfirm={handleDelete} />
    </div>
  )
}
