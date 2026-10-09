import { useState, type SyntheticEvent } from 'react'
import { Button, Card, IconButton } from '../ui'
import { IconCheck, IconClose, IconEdit, IconUserPlus } from '../icons'
import { PatientFormFields } from './PatientFormFields'
import { usePatientForm } from './usePatientForm'
import type { PacienteResumo } from '../../lib/api'
import { toastError, toastSuccess } from '../../lib/toast'

interface PatientFormProps {
  paciente?: PacienteResumo // Adicionado para suportar edição
  onCancel: () => void
  onSuccess?: (paciente: PacienteResumo) => void
}

export function PatientForm({ paciente, onCancel, onSuccess }: PatientFormProps) {
  const form = usePatientForm(paciente)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault()

    const validationError = form.validate()
    if (validationError) {
      setSubmitError(validationError)
      return
    }

    setLoading(true)
    setSubmitError('')
    try {
      const resultado = await form.submit()
      toastSuccess(form.isEditing ? 'Paciente atualizado com sucesso.' : 'Paciente cadastrado com sucesso.')
      if (onSuccess) onSuccess(resultado)
      else onCancel()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro de conexão com o servidor.'
      setSubmitError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card padded={false} style={{ overflow: 'hidden', borderColor: 'color-mix(in oklch, var(--tm-primary) 35%, var(--tm-border))' }}>
        <div className="flex items-center gap-3 border-b border-tm-border bg-[color-mix(in_oklch,var(--tm-primary)_7%,var(--tm-surface))] px-5 py-4">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
            {form.isEditing ? <IconEdit size={20} /> : <IconUserPlus size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">
              {form.isEditing ? 'Editar paciente' : 'Novo paciente'}
            </div>
            <div className="text-tm-sm text-tm-fg-muted">
              {form.isEditing ? 'Atualize os dados e a localização do paciente.' : 'Cadastre os dados e a localização do paciente.'}
            </div>
          </div>
          <IconButton icon={<IconClose size={20} />} label="Cancelar" onClick={onCancel} />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-6 p-5">
          <PatientFormFields form={form} loading={loading} />

          {submitError && (
            <div className="rounded-tm-sm bg-tm-danger-bg p-3 text-tm-sm font-medium text-tm-danger-fg">
              {submitError}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2.5 border-t border-tm-border pt-4">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" icon={<IconCheck size={16} />} disabled={loading}>
              {loading ? 'Salvando...' : (form.isEditing ? 'Atualizar paciente' : 'Criar paciente')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
