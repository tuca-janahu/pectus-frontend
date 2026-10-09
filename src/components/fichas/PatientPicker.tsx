import { useCallback, useEffect, useState } from 'react'
import { Dropdown } from '../ui'
import type { DropdownOption } from '../ui'
import { IconUser, IconUserPlus } from '../icons'
import { useAuth } from '../../auth/AuthContext'
import { listPacientes, ApiError, type PacienteResumo } from '../../lib/api'
import { toastError } from '../../lib/toast'
import { PatientForm } from '../pacientes/PatientForm'

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--
  return idade
}

interface PatientPickerProps {
  value: number | ''
  onChange: (pacienteId: number) => void
  error?: string
  disabled?: boolean
  // Dispara sempre que a lista de pacientes carregada mudar (carga inicial ou
  // criação inline) — permite ao chamador resolver nome/avatar do paciente
  // selecionado sem precisar buscar a lista de novo.
  onPatientsChange?: (pacientes: PacienteResumo[]) => void
}

// Seletor de paciente reutilizado pelos fluxos de ficha. Caso o paciente não
// exista ainda, "Cadastrar novo" renderiza o mesmo PatientForm da tela de
// Pacientes — sem duplicar o formulário nem perder o progresso da ficha.
export function PatientPicker({ value, onChange, error, disabled, onPatientsChange }: PatientPickerProps) {
  const { accessToken } = useAuth()
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const carregar = useCallback(async () => {
    if (!accessToken) return
    setLoading(true)
    try {
      const { pacientes: lista } = await listPacientes(accessToken)
      setPacientes(lista)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível carregar os pacientes.'
      toastError(message)
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    carregar()
  }, [carregar])

  useEffect(() => {
    onPatientsChange?.(pacientes)
  }, [pacientes, onPatientsChange])

  if (showCreate) {
    return (
      <PatientForm
        onCancel={() => setShowCreate(false)}
        onSuccess={(paciente) => {
          setPacientes((arr) => [paciente, ...arr])
          onChange(paciente.id)
          setShowCreate(false)
        }}
      />
    )
  }

  const options: DropdownOption[] = pacientes.map((p) => ({
    value: p.id,
    label: `${p.nome} — ${calcularIdade(p.dataNascimento)} anos`,
  }))

  return (
    <div className="flex flex-col gap-2">
      <Dropdown
        label="Paciente"
        icon={<IconUser size={18} />}
        options={options}
        value={value}
        onChange={(v) => onChange(Number(v))}
        placeholder={loading ? 'Carregando pacientes...' : 'Selecione um paciente'}
        disabled={disabled || loading}
        error={error}
        required
      />
      <button
        type="button"
        onClick={() => setShowCreate(true)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 self-start text-tm-sm font-semibold text-tm-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <IconUserPlus size={14} /> Paciente não encontrado? Cadastrar novo
      </button>
    </div>
  )
}
