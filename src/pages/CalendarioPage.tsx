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
import { FichaCard } from '../components/fichas/FichaCard'
import {
  ApiError,
  connectGoogleCalendar,
  getGoogleCalendarStatus,
  listPacientes,
  type AuthUser,
  type PacienteResumo,
} from '../lib/api'
import { deleteFicha, listFichas, type Ficha } from '../lib/fichasStore'
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

function filtrarFichasUsuario(fichas: Ficha[], user: AuthUser): Ficha[] {
  if (user.roles.includes('MEDICO') && user.medico) {
    return fichas.filter((f) => f.medicoId === user.medico?.id)
  }
  return fichas
}

interface DiaGrade {
  dataISO: string
  diaNumero: number
  mesAtual: boolean
  isHoje: boolean
  fichas: Ficha[]
}

function gerarDiasDoMes(ano: number, mes: number, fichas: Ficha[], hojeStr: string): DiaGrade[] {
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
      fichas: fichas.filter((f) => f.data === iso),
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
      fichas: fichas.filter((f) => f.data === iso),
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
      fichas: fichas.filter((f) => f.data === iso),
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

  // Fichas e pacientes da API
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [loadingAgenda, setLoadingAgenda] = useState(true)

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
      const [fichasRes, pacientesRes] = await Promise.all([
        listFichas(accessToken),
        listPacientes(accessToken),
      ])
      setFichas(fichasRes)
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

  // Navegação de meses
  const irMesAnterior = () => {
    if (mesAtual === 0) {
      setMesAtual(11)
      setAnoAtual((a) => a - 1)
    } else {
      setMesAtual((m) => m - 1)
    }
  }

  const irProximoMes = () => {
    if (mesAtual === 11) {
      setMesAtual(0)
      setAnoAtual((a) => a + 1)
    } else {
      setMesAtual((m) => m + 1)
    }
  }

  const irParaHoje = () => {
    const d = new Date()
    setAnoAtual(d.getFullYear())
    setMesAtual(d.getMonth())
    setDiaSelecionado(hojeISO())
  }

  const selecionarMesAno = (m: number, a: number) => {
    setMesAtual(m)
    setAnoAtual(a)
    setSeletorAberto(false)
  }

  const handleEdit = (ficha: Ficha) => {
    navigate(`/fichas/${ficha.id}/editar?retorno=/calendario`)
  }

  const handleDelete = async (ficha: Ficha) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return
    try {
      if (!accessToken) return
      await deleteFicha(accessToken, ficha.id)
      toastSuccess('Ficha cancelada com sucesso.')
      await carregarDados()
    } catch {
      toastError('Não foi possível cancelar o agendamento.')
    }
  }

  const fichasFiltradas = useMemo(() => {
    return user ? filtrarFichasUsuario(fichas, user) : []
  }, [fichas, user])

  const diasGrade = useMemo(() => {
    return gerarDiasDoMes(anoAtual, mesAtual, fichasFiltradas, hoje)
  }, [anoAtual, mesAtual, fichasFiltradas, hoje])

  // Fichas do dia selecionado
  const fichasDoDiaSelecionado = useMemo(() => {
    return fichasFiltradas
      .filter((f) => f.data === diaSelecionado)
      .sort((a, b) => a.hora.localeCompare(b.hora))
  }, [fichasFiltradas, diaSelecionado])

  const totalFichasDia = fichasDoDiaSelecionado.length
  const textoTotalFichas =
    totalFichasDia === 0
      ? 'Nenhuma ficha agendada'
      : `${totalFichasDia} ${totalFichasDia === 1 ? 'ficha agendada' : 'fichas agendadas'}`

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 text-tm-fg">
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
                  Veja e sincronize as fichas direto na sua agenda do Google.
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
              className="shrink-0 font-semibold bg-white dark:bg-tm-surface border border-tm-border text-tm-fg hover:bg-tm-surface-2 shadow-sm"
            >
              {conectando ? 'Conectando...' : 'Conectar'}
            </Button>
          </div>
        </Card>
      )}

      {/* 2. CABEÇALHO DO MÊS E NAVEGAÇÃO INTERATIVA (BLOCO AZUL) + GRELHA */}
      <Card padded={false} style={{ overflow: 'visible' }}>
        <div className="rounded-tm-card overflow-hidden">
          {/* BLOCO AZUL: Ano, Mês com seletor interativo e navegação */}
          <div className="relative flex items-center justify-between bg-[linear-gradient(135deg,var(--tm-primary)_0%,var(--tm-primary-deep)_100%)] p-5 text-white">
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
                <div className="absolute left-0 top-full z-30 mt-2 w-[280px] rounded-tm-card border border-tm-border bg-tm-surface p-4 shadow-2xl sm:w-[320px] text-tm-fg animate-in fade-in zoom-in-95 duration-150">
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
                    <span className="font-mono text-tm-lg font-bold text-tm-fg">{anoSeletor}</span>
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
                              ? 'bg-tm-primary text-white shadow-sm'
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
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-tm-button border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/30"
              >
                <IconChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={irProximoMes}
                aria-label="Próximo mês"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-tm-button border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/30"
              >
                <IconChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* CABEÇALHO DA GRELHA (DOM, SEG, TER...) */}
          <div className="grid grid-cols-7 border-b border-tm-border bg-tm-surface-2 text-center text-tm-xs font-bold uppercase tracking-wider text-tm-fg-muted">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="py-2.5">
                {dia}
              </div>
            ))}
          </div>

          {/* GRELHA MENSAL COM BADGE NUMÉRICO CIRCULAR DE NOTIFICAÇÃO */}
          <div className="grid grid-cols-7 gap-px bg-tm-border">
            {diasGrade.map((dia) => {
              const isSelecionado = dia.dataISO === diaSelecionado
              const quantidadeConsultas = dia.fichas.length

              return (
                <div
                  key={dia.dataISO}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDiaSelecionado(dia.dataISO)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setDiaSelecionado(dia.dataISO)
                    }
                  }}
                  className={`relative flex min-h-[76px] sm:min-h-[92px] cursor-pointer flex-col items-center justify-center p-2 transition-all focus:outline-none ${
                    dia.mesAtual ? 'bg-tm-surface' : 'bg-tm-surface-2/40 text-tm-fg-subtle'
                  } ${
                    isSelecionado
                      ? 'border-2 border-tm-primary bg-[color-mix(in_oklch,var(--tm-primary)_9%,var(--tm-surface))] rounded-xl shadow-sm z-10 m-[-1px]'
                      : 'hover:bg-tm-surface-2'
                  }`}
                >
                  {/* Badge numérico circular de notificação com cor idêntica ao sino do sistema */}
                  {quantidadeConsultas > 0 && (
                    <span
                      className="absolute top-2 right-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[oklch(0.65_0.18_25)] px-1.5 text-[11px] font-bold text-white shadow-sm"
                      title={`${quantidadeConsultas} consulta(s) agendada(s)`}
                    >
                      {quantidadeConsultas}
                    </span>
                  )}

                  {/* Número do Dia */}
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-tm-sm font-semibold transition-transform ${
                      dia.isHoje
                        ? 'bg-tm-primary text-white shadow-sm'
                        : isSelecionado
                          ? 'font-bold text-tm-primary text-tm-base'
                          : dia.mesAtual
                            ? 'text-tm-fg'
                            : 'text-tm-fg-subtle opacity-40'
                    }`}
                  >
                    {dia.diaNumero}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* 4. BARRA DE RESUMO DO DIA SELECIONADO */}
      <div className="flex flex-col gap-3 rounded-tm-card border border-tm-border bg-tm-surface p-4 sm:flex-row sm:items-center sm:justify-between shadow-tm-card">
        {/* À Esquerda: Data completa e total de fichas */}
        <div>
          <h3 className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">
            {formatarDataResumo(diaSelecionado)}
          </h3>
          <p className="mt-0.5 text-tm-sm text-tm-fg-muted font-medium">
            {textoTotalFichas}
          </p>
        </div>

        {/* À Direita: Botão secundário "Hoje" e botão primário "+ Novo Agendamento" */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={irParaHoje}>
            Hoje
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<IconPlus size={16} />}
            onClick={() => navigate(`/fichas/nova/agendamento?data=${diaSelecionado}`)}
          >
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* 5. LISTA DE AGENDAMENTOS (CARDS DOS PACIENTES DO DIA SELECIONADO) */}
      <div className="flex flex-col gap-3">
        {loadingAgenda ? (
          <Card padded>
            <div className="py-6 text-center text-tm-sm text-tm-fg-muted">
              Carregando agendamentos...
            </div>
          </Card>
        ) : fichasDoDiaSelecionado.length === 0 ? (
          <Card padded>
            <EmptyState
              icon={<IconCalendar size={28} />}
              title="Nenhum paciente agendado"
              body="Não há fichas ou consultas programadas para este dia."
              action={
                <Button
                  size="sm"
                  icon={<IconPlus size={16} />}
                  onClick={() => navigate(`/fichas/nova/agendamento?data=${diaSelecionado}`)}
                >
                  Agendar paciente
                </Button>
              }
            />
          </Card>
        ) : (
          fichasDoDiaSelecionado.map((ficha) => {
            const paciente = pacientes.find((p) => p.id === ficha.pacienteId)
            return (
              <FichaCard
                key={ficha.id}
                ficha={ficha}
                pacienteNome={paciente?.nome ?? `Paciente #${ficha.pacienteId}`}
                iniciais={paciente ? obterIniciais(paciente.nome) : '?'}
                avatarColor={AVATAR_COLORS[ficha.pacienteId % AVATAR_COLORS.length]}
                fotoUrl={paciente?.fotoUrl}
                onClick={() => handleEdit(ficha)}
                onEdit={() => handleEdit(ficha)}
                onDelete={() => handleDelete(ficha)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
