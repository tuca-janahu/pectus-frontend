import { useMemo, useState } from 'react'
import { Avatar, Button, Card, Select } from '../ui'
import type { AvatarColor } from '../ui'
import { IconCheck, IconClose, IconStethoscope } from '../icons'
import { PatientPicker } from './PatientPicker'
import { FichaClinicalFields } from './FichaClinicalFields'
import { PROCEDIMENTOS } from '../../data/procedimentos'
import {
  EMPTY_CLINICAL_VALUES,
  clinicalValuesFromFicha,
  createFicha,
  deleteFicha,
  updateFicha,
  type Ficha,
  type FichaClinicalValues,
} from '../../lib/fichasStore'
import type { PacienteResumo } from '../../lib/api'
import { toastError, toastSuccess } from '../../lib/toast'
import { useAuth } from '../../auth/AuthContext'

const AVATAR_COLORS: AvatarColor[] = ['sky', 'teal', 'violet', 'rose', 'amber']

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

interface FichaAoVivoProps {
  onCancel: () => void
  onSuccess: (ficha: Ficha) => void
}

export function FichaAoVivo({ onCancel, onSuccess }: FichaAoVivoProps) {
  const { accessToken, user } = useAuth()
  const [pacienteId, setPacienteId] = useState<number | ''>('')
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [procedimento, setProcedimento] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [clinical, setClinical] = useState<FichaClinicalValues>({ ...EMPTY_CLINICAL_VALUES })
  const [draft, setDraft] = useState<Ficha | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const data = useMemo(() => hojeISO(), [])
  const hora = useMemo(() => new Date().toTimeString().slice(0, 5), [])
  const paciente = pacientes.find((item) => item.id === pacienteId)
  const avatarColor = paciente ? AVATAR_COLORS[paciente.id % AVATAR_COLORS.length] : 'sky'

  const validarContexto = () => {
    if (!pacienteId) return 'Selecione um paciente.'
    if (!procedimento) return 'Selecione o procedimento.'
    if (!accessToken || !user?.medico?.id) return 'Seu usuário não possui um perfil médico ativo.'
    return null
  }

  const iniciar = async () => {
    const validationError = validarContexto()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    try {
      const ficha = await createFicha(accessToken!, user!.medico!.id, {
        pacienteId: pacienteId as number,
        data,
        hora,
        procedimento,
        status: 'pendente',
        descricao: '',
        modo: 'ao-vivo',
      })
      setDraft(ficha)
      setClinical(clinicalValuesFromFicha(ficha))
      setObservacoes(ficha.descricao)
      toastSuccess('Atendimento iniciado com os dados da última ficha.')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Não foi possível iniciar o atendimento.')
    } finally {
      setLoading(false)
    }
  }

  const salvar = async (concluir: boolean) => {
    if (!draft || !accessToken || !user?.medico?.id) return
    setLoading(true)
    try {
      const ficha = await updateFicha(accessToken, user.medico.id, draft.id, {
        pacienteId: draft.pacienteId,
        data: draft.data,
        hora: draft.hora,
        procedimento,
        status: concluir ? 'concluida' : 'pendente',
        descricao: observacoes,
        modo: 'ao-vivo',
        ...clinical,
      })
      toastSuccess(concluir ? 'Ficha concluída com sucesso.' : 'Rascunho salvo com sucesso.')
      onSuccess(ficha)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Não foi possível salvar a ficha.')
    } finally {
      setLoading(false)
    }
  }

  const cancelar = async () => {
    if (!draft || !accessToken) {
      onCancel()
      return
    }
    setLoading(true)
    try {
      await deleteFicha(accessToken, draft.id)
      toastSuccess('Atendimento cancelado.')
      onCancel()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Não foi possível cancelar o atendimento.')
    } finally {
      setLoading(false)
    }
  }

  if (!draft) {
    return (
      <Card padded={false}>
        <div className="flex items-center gap-3 border-b border-tm-border px-5 py-4">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-[11px] bg-tm-primary text-white">
            <IconStethoscope size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-tm-xl font-bold text-tm-fg">Iniciar atendimento</h2>
            <p className="text-tm-sm text-tm-fg-muted">A ficha será preenchida com os dados da última consulta concluída.</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <PatientPicker
            value={pacienteId}
            onChange={(id) => {
              setPacienteId(id)
              setError('')
            }}
            onPatientsChange={setPacientes}
            disabled={loading}
          />
          <Select
            label="Procedimento"
            value={procedimento}
            onChange={(value) => {
              setProcedimento(value)
              setError('')
            }}
            options={PROCEDIMENTOS.map((item) => ({ value: item, label: item }))}
            placeholder="Selecione o procedimento"
            disabled={loading}
          />
          {error && <div className="text-tm-sm font-medium text-tm-error-text">{error}</div>}
          <div className="flex justify-end gap-2.5 border-t border-tm-border pt-4">
            <Button variant="secondary" onClick={onCancel} disabled={loading}>Voltar</Button>
            <Button onClick={iniciar} icon={<IconStethoscope size={16} />} disabled={loading}>
              {loading ? 'Iniciando...' : 'Iniciar atendimento'}
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card padded={false}>
      <div className="flex items-center gap-3 border-b border-tm-border bg-[color-mix(in_oklch,var(--tm-primary)_7%,var(--tm-surface))] px-5 py-4">
        {paciente && <Avatar initials={obterIniciais(paciente.nome)} color={avatarColor} size={40} />}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-tm-xl font-bold text-tm-fg">{paciente?.nome ?? 'Atendimento em andamento'}</h2>
          <p className="text-tm-sm text-tm-fg-muted">{draft.data.split('-').reverse().join('/')} às {draft.hora}</p>
        </div>
        <Button variant="ghost" onClick={cancelar} icon={<IconClose size={16} />} disabled={loading}>
          Cancelar atendimento
        </Button>
      </div>

      <div className="flex flex-col gap-5 p-5">
        <Select
          label="Procedimento"
          value={procedimento}
          onChange={setProcedimento}
          options={PROCEDIMENTOS.map((item) => ({ value: item, label: item }))}
          disabled={loading}
        />

        <FichaClinicalFields value={clinical} onChange={setClinical} disabled={loading} />

        <label className="flex flex-col gap-1.5">
          <span className="text-tm-base font-semibold text-tm-fg">Observações da consulta</span>
          <textarea
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            placeholder="Achados, conduta e orientações específicas desta consulta"
            rows={5}
            disabled={loading}
            className="min-h-[110px] resize-y rounded-tm-input border-[1.5px] border-tm-border bg-tm-surface px-3.5 py-3 font-[inherit] text-tm-md text-tm-fg outline-none transition-all focus:border-tm-primary focus:shadow-[0_0_0_4px_var(--tm-focus-ring)] disabled:opacity-50"
          />
        </label>

        <div className="flex flex-wrap justify-end gap-2.5 border-t border-tm-border pt-4">
          <Button variant="secondary" onClick={() => salvar(false)} disabled={loading}>Salvar rascunho</Button>
          <Button onClick={() => salvar(true)} icon={<IconCheck size={16} />} disabled={loading}>
            {loading ? 'Salvando...' : 'Concluir ficha'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
