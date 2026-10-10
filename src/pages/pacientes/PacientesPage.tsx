import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import type { AvatarColor } from '../../components/ui'
import { IconPlus, IconChevronRight } from '../../components/icons'
import { PatientCard } from '../../components/pacientes/PatientCard'
import { PatientForm } from '../../components/pacientes/PatientForm'
import { useAuth } from '../../auth/AuthContext'
import { listPacientes, ApiError, type PacienteResumo } from '../../lib/api'
import { listFichas } from '../../lib/fichasStore'
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

  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [fichasPorPaciente, setFichasPorPaciente] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const carregarPacientes = useCallback(async () => {
    if (!accessToken) return

    setLoading(true)
    setError('')
    try {
      const { pacientes: lista } = await listPacientes(accessToken, searchTerm || undefined)
      setPacientes(lista)
      onCountChange?.(lista.length)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível carregar os pacientes.'
      setError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }, [accessToken, searchTerm, onCountChange])

  useEffect(() => {
    carregarPacientes()
  }, [carregarPacientes])

  useEffect(() => {
    if (!accessToken) return
    listFichas(accessToken)
      .then((fichas) => {
        const contagens = fichas.reduce<Record<number, number>>((acc, ficha) => {
          acc[ficha.pacienteId] = (acc[ficha.pacienteId] ?? 0) + 1
          return acc
        }, {})
        setFichasPorPaciente(contagens)
      })
      .catch((err) => {
        toastError(err instanceof Error ? err.message : 'Não foi possível carregar a contagem de fichas.')
      })
  }, [accessToken])

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const m = hoje.getMonth() - nascimento.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--
    }
    return idade
  }

  const obterIniciais = (nome: string) => {
    const partes = nome.trim().split(' ')
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
    }
    return nome.substring(0, 2).toUpperCase()
  }

  return (
    <div className="flex flex-col gap-6 text-tm-fg">
      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-between rounded-tm-card bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] p-4 text-white shadow-tm-card transition hover:shadow-tm-card-hover"
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
          {pacientes.map((paciente, i) => (
            <PatientCard
              key={paciente.id}
              nome={paciente.nome}
              idade={calcularIdade(paciente.dataNascimento)}
              fichas={fichasPorPaciente[paciente.id] ?? 0}
              iniciais={obterIniciais(paciente.nome)}
              avatarColor={AVATAR_COLORS[i % AVATAR_COLORS.length]}
              fotoUrl={paciente.fotoUrl}
              onClick={() => navigate(`/pacientes/${paciente.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
