import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import type { AvatarColor } from '../../components/ui'
import { IconPlus, IconChevronRight } from '../../components/icons'
import { PatientCard } from '../../components/pacientes/PatientCard'
import { PatientForm } from '../../components/pacientes/PatientForm'
import { useAuth } from '../../auth/AuthContext'
import { listPacientes, ApiError, type PacienteResumo } from '../../lib/api'
import { listAtendimentos } from '../../lib/atendimentosStore'
import { obterIniciais, calcularIdadeAnos } from '../../lib/pacienteFormat'
import { toastError } from '../../lib/toast'

export interface PacientesPageProps {
  searchTerm?: string
  onCountChange?: (count: number) => void
}

const AVATAR_COLORS: AvatarColor[] = ['sky', 'teal', 'violet', 'rose', 'amber']

export function PacientesPage({ searchTerm = '', onCountChange }: PacientesPageProps) {
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [incluirInativos, setIncluirInativos] = useState(false)

  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [atendimentosPorPaciente, setAtendimentosPorPaciente] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const carregarPacientes = useCallback(async () => {
    if (!accessToken) return

    setLoading(true)
    setError('')
    try {
      const { pacientes: lista } = await listPacientes(accessToken, searchTerm || undefined, incluirInativos)
      setPacientes(lista)
      onCountChange?.(lista.length)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível carregar os pacientes.'
      setError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }, [accessToken, searchTerm, incluirInativos, onCountChange])

  useEffect(() => {
    carregarPacientes()
  }, [carregarPacientes])

  useEffect(() => {
    if (!accessToken) return
    listAtendimentos(accessToken)
      .then((atendimentos) => {
        const contagens = atendimentos.reduce<Record<number, number>>((acc, atendimento) => {
          acc[atendimento.pacienteId] = (acc[atendimento.pacienteId] ?? 0) + 1
          return acc
        }, {})
        setAtendimentosPorPaciente(contagens)
      })
      .catch((err) => {
        toastError(err instanceof Error ? err.message : 'Não foi possível carregar a contagem de atendimentos.')
      })
  }, [accessToken])
  return (
    <div className="flex flex-col gap-6 text-tm-fg">
      <label className="inline-flex items-center gap-2 self-start text-tm-sm text-tm-fg-muted">
        <input type="checkbox" checked={incluirInativos} onChange={(event) => setIncluirInativos(event.target.checked)} />
        Incluir pacientes inativos
      </label>
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-between rounded-tm-card bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] p-4 text-white shadow-tm-card transition hover:shadow-tm-card-hover cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-tm-sm bg-white/20 p-2">
              <IconPlus size={24} className="text-white" />
            </div>
            <div className="text-left font-tm-body">
              <span className="block text-tm-xl font-bold leading-tight">Adicionar novo paciente</span>
              <span className="mt-0.5 block text-tm-sm font-medium text-white/85">
                Cadastre dados, histórico e foto
              </span>
            </div>
          </div>
          <IconChevronRight size={24} className="text-white/70" />
        </button>
      )}

      {showForm && (
        <PatientForm
          onCancel={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            carregarPacientes()
          }}
        />
      )}

      {error ? (
        <div className="flex flex-col items-start gap-2 py-4">
          <p className="text-tm-sm text-tm-error-text">{error}</p>
          <Button type="button" size="sm" variant="secondary" onClick={carregarPacientes}>
            Tentar novamente
          </Button>
        </div>
      ) : loading ? (
        <div className="text-tm-sm text-tm-fg-muted py-4">Carregando pacientes...</div>
      ) : pacientes.length === 0 ? (
        <div className="text-tm-sm text-tm-fg-muted py-4">Nenhum paciente encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pacientes.map((paciente) => (
            <PatientCard
              key={paciente.id}
              nome={paciente.nome}
              idade={calcularIdadeAnos(paciente.dataNascimento)}
              atendimentos={atendimentosPorPaciente[paciente.id] ?? 0}
              iniciais={obterIniciais(paciente.nome)}
              avatarColor={AVATAR_COLORS[paciente.id % AVATAR_COLORS.length]}
              fotoUrl={paciente.fotoUrl}
              onClick={() => navigate(`/pacientes/${paciente.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
