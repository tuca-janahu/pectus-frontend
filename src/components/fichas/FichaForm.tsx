import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Button, Card, Dropdown, IconButton, Input, Select } from '../ui'
import type { DropdownOption } from '../ui'
import { IconArrowLeft, IconCheck, IconClipboard, IconClose, IconEdit, IconUser, IconUserPlus } from '../icons'
import { PatientFormFields } from '../pacientes/PatientFormFields'
import { usePatientForm } from '../pacientes/usePatientForm'
import { PROCEDIMENTOS, STATUS_OPTIONS } from '../../data/procedimentos'
import {
  EMPTY_CLINICAL_VALUES,
  clinicalValuesFromFicha,
  createFicha,
  updateFicha,
  type Ficha,
  type FichaClinicalValues,
  type FichaInput,
} from '../../lib/fichasStore'
import type { FichaStatus } from '../ui'
import { useAuth } from '../../auth/AuthContext'
import { listPacientes, ApiError, type PacienteResumo } from '../../lib/api'
import { toastError, toastSuccess } from '../../lib/toast'
import { FichaClinicalFields } from './FichaClinicalFields'

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--
  return idade
}

interface FichaFormProps {
  ficha?: Ficha
  onCancel: () => void
  onSuccess: (ficha: Ficha) => void
}

export function FichaForm({ ficha, onCancel, onSuccess }: FichaFormProps) {
  const isEditing = !!ficha
  const { accessToken, user } = useAuth()

  // Paciente: ou seleciona um existente, ou cadastra um novo — nesse segundo
  // caso o mesmo botão de salvar cria o paciente e a ficha em uma única ação.
  const [modoPaciente, setModoPaciente] = useState<'existente' | 'novo'>('existente')
  const [pacienteId, setPacienteId] = useState<number | ''>(ficha?.pacienteId ?? '')
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const novoPacienteForm = usePatientForm()

  const [data, setData] = useState(ficha?.data || hojeISO())
  const [hora, setHora] = useState(ficha?.hora || '09:00')
  const [procedimento, setProcedimento] = useState(ficha?.procedimento || '')
  const [status, setStatus] = useState<FichaStatus>(ficha?.status || 'agendada')
  const [descricao, setDescricao] = useState(ficha?.descricao || '')
  const [clinical, setClinical] = useState<FichaClinicalValues>(
    ficha ? clinicalValuesFromFicha(ficha) : { ...EMPTY_CLINICAL_VALUES },
  )
  const [error, setError] = useState<{ pacienteId?: string; data?: string; procedimento?: string }>({})
  const [loading, setLoading] = useState(false)

  const carregarPacientes = useCallback(async () => {
    if (!accessToken) return
    setLoadingPacientes(true)
    try {
      const { pacientes: lista } = await listPacientes(accessToken)
      setPacientes(lista)
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : 'Não foi possível carregar os pacientes.')
    } finally {
      setLoadingPacientes(false)
    }
  }, [accessToken])

  useEffect(() => {
    carregarPacientes()
  }, [carregarPacientes])

  const pacienteOptions: DropdownOption[] = pacientes.map((p) => ({
    value: p.id,
    label: `${p.nome} — ${calcularIdade(p.dataNascimento)} anos`,
  }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const err: typeof error = {}
    if (modoPaciente === 'existente' && !pacienteId) {
      err.pacienteId = 'Selecione um paciente'
    } else if (modoPaciente === 'novo') {
      const patientError = novoPacienteForm.validate()
      if (patientError) err.pacienteId = patientError
    }
    if (!data) err.data = 'Informe a data'
    if (!procedimento) err.procedimento = 'Selecione o procedimento'
    setError(err)
    if (Object.keys(err).length) return

    setLoading(true)
    try {
      let finalPacienteId = pacienteId as number
      if (modoPaciente === 'novo') {
        const novoPaciente = await novoPacienteForm.submit()
        finalPacienteId = novoPaciente.id
        toastSuccess('Paciente cadastrado com sucesso.')
      }

      const input: FichaInput = {
        pacienteId: finalPacienteId,
        data,
        hora,
        procedimento,
        status,
        descricao,
        modo: ficha?.modo ?? 'previa',
        ...(status === 'pendente' || status === 'concluida' ? clinical : {}),
      }
      if (!accessToken || !user?.medico?.id) throw new Error('Seu usuário não possui um perfil médico ativo.')
      const salva = isEditing
        ? await updateFicha(accessToken, user.medico.id, ficha.id, input)
        : await createFicha(accessToken, user.medico.id, input)
      toastSuccess(isEditing ? 'Ficha atualizada com sucesso.' : 'Ficha criada com sucesso.')
      onSuccess(salva)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Não foi possível salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const submitLabel = isEditing ? 'Salvar alterações' : modoPaciente === 'novo' ? 'Criar paciente e ficha' : 'Criar ficha'

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-2 self-start rounded-tm-sm text-tm-sm font-medium text-tm-fg-muted transition-colors hover:text-tm-primary"
      >
        <IconArrowLeft size={16} />
        Voltar para a lista de fichas
      </button>
      <Card padded={false} style={{ overflow: 'hidden', borderColor: 'color-mix(in oklch, var(--tm-primary) 35%, var(--tm-border))' }}>
        <div className="flex items-center gap-3 border-b border-tm-border bg-[color-mix(in_oklch,var(--tm-primary)_7%,var(--tm-surface))] px-5 py-4">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
          {isEditing ? <IconEdit size={20} /> : <IconClipboard size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">
            {isEditing ? 'Editar ficha' : 'Nova ficha epicrítica'}
          </div>
          <div className="text-tm-sm text-tm-fg-muted">
            {isEditing ? 'Atualize os dados do procedimento.' : 'Registre um novo procedimento.'}
          </div>
        </div>
        <IconButton icon={<IconClose size={20} />} label="Cancelar" onClick={onCancel} />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4 p-5">
        {modoPaciente === 'existente' ? (
          <div className="flex flex-col gap-2">
            <Dropdown
              label="Paciente"
              icon={<IconUser size={18} />}
              options={pacienteOptions}
              value={pacienteId}
              onChange={(v) => setPacienteId(Number(v))}
              placeholder={loadingPacientes ? 'Carregando pacientes...' : 'Selecione um paciente'}
              disabled={loading || loadingPacientes}
              error={error.pacienteId}
              required
            />
            <button
              type="button"
              onClick={() => setModoPaciente('novo')}
              disabled={loading}
              className="inline-flex items-center gap-1.5 self-start text-tm-sm font-semibold text-tm-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconUserPlus size={14} /> Paciente não encontrado? Cadastrar novo
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-tm-input border border-tm-border bg-tm-surface-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-tm-base font-semibold text-tm-fg">Novo paciente</span>
              <button
                type="button"
                onClick={() => setModoPaciente('existente')}
                disabled={loading}
                className="text-tm-sm font-semibold text-tm-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Selecionar paciente existente
              </button>
            </div>
            <PatientFormFields form={novoPacienteForm} loading={loading} />
            {error.pacienteId && <span className="text-tm-sm text-tm-error-text">{error.pacienteId}</span>}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} error={error.data} disabled={loading} />
          <Input label="Horário" type="time" value={hora} onChange={(e) => setHora(e.target.value)} disabled={loading} />
        </div>

        <Select
          label="Procedimento"
          value={procedimento}
          onChange={setProcedimento}
          options={PROCEDIMENTOS.map((p) => ({ value: p, label: p }))}
          placeholder="Selecione o tipo"
          error={error.procedimento}
          disabled={loading}
        />

        <Select
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as FichaStatus)}
          options={STATUS_OPTIONS.filter((option) => !ficha || ficha.status === 'agendada' || option.value !== 'agendada')}
          disabled={loading}
        />

        {(status === 'pendente' || status === 'concluida') && (
          <FichaClinicalFields value={clinical} onChange={setClinical} disabled={loading} />
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-tm-base font-semibold text-tm-fg">Descrição / observações</span>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Detalhes do procedimento, achados, conduta..."
            rows={5}
            disabled={loading}
            className="min-h-[100px] resize-y rounded-tm-input border-[1.5px] border-tm-border bg-tm-surface px-3.5 py-3 font-[inherit] text-tm-md text-tm-fg outline-none transition-all focus:border-tm-primary focus:shadow-[0_0_0_4px_var(--tm-focus-ring)]"
          />
        </label>

        <div className="mt-2 flex justify-end gap-2.5 border-t border-tm-border pt-4">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" icon={<IconCheck size={16} />} disabled={loading}>
            {loading ? 'Salvando...' : submitLabel}
          </Button>
        </div>
        </form>
      </Card>
    </div>
  )
}
