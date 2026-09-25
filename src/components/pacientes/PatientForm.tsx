import { useState, type SyntheticEvent } from 'react'
import { Card, Input, Button, IconButton, Dropdown } from '../ui'
import { InputCpf } from '../ui/InputCpf'
import { InputPhone } from '../ui/InputPhone'
import { 
  IconUserPlus, 
  IconClose, 
  IconUser, 
  IconActivity, 
  IconCheck, 
  IconMapPin 
} from '../icons'
import { AddressSelector, type AddressSelectorValue } from './AddressSelector'
import { useAuth } from '../../auth/AuthContext'

interface PatientFormProps {
  onCancel: () => void
  onSuccess?: () => void 
}

export function PatientForm({ onCancel, onSuccess }: PatientFormProps) {
  const { accessToken } = useAuth()

  const [nome, setNome] = useState('')
  const [documento, setDocumento] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [genero, setGenero] = useState('')
  
  const [enderecoNacional, setEnderecoNacional] = useState<AddressSelectorValue>({
    estadoId: '',
    estadoSigla: '',
    municipioId: '',
    municipioNome: '',
  })

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const generoOptions = [
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMININO', label: 'Feminino' },
    { value: 'OUTRO', label: 'Outro' }
  ]

  const submit = async (e: SyntheticEvent) => {
    e.preventDefault()
    
    if (!accessToken) {
      setSubmitError('Sessão expirada. Faça login novamente.')
      return
    }

    if (!enderecoNacional.municipioId) {
      setSubmitError('Por favor, selecione o Estado e o Município.')
      return
    }

    if (!dataNascimento || !genero) {
      setSubmitError('Por favor, preencha a data de nascimento e o gênero.')
      return
    }

    setLoading(true)
    setSubmitError('')

    try {
      const payload = {
        nome,
        documento: documento.replace(/\D/g, ''),
        telefone: telefone.replace(/\D/g, ''),
        dataNascimento: new Date(dataNascimento).toISOString(),
        genero,
        municipioId: enderecoNacional.municipioId
      }

      const res = await fetch('http://localhost:3000/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Ocorreu um erro ao cadastrar o paciente.')
      }

      if (onSuccess) onSuccess()
      else onCancel()

    } catch (err: any) {
      setSubmitError(err.message || 'Erro de conexão com o servidor.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in fade-in duration-300">
      <Card 
        padded={false} 
        style={{ borderColor: 'color-mix(in oklch, var(--tm-primary) 35%, var(--tm-border))' }}
      >
        <div className="flex items-center gap-3 border-b border-tm-border bg-[color-mix(in_oklch,var(--tm-primary)_7%,var(--tm-surface))] px-5 py-4">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
            <IconUserPlus size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">Novo paciente</div>
            <div className="text-tm-sm text-tm-fg-muted">Cadastre os dados e a localização do paciente.</div>
          </div>
          <IconButton icon={<IconClose size={20} />} label="Cancelar" onClick={onCancel} />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-6 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Input
                label="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Artur Janahú"
                icon={<IconUser size={18} />}
                required
                disabled={loading}
              />
            </div>
            
            <InputCpf
              label="Documento (CPF)"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="000.000.000-00"
              icon={<IconActivity size={18} />}
              required
              disabled={loading}
            />

            <InputPhone
              label="Telefone / Celular"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              required
              disabled={loading}
            />

            <Input
              label="Data de Nascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              required
              disabled={loading}
            />

            <Dropdown
              label="Gênero"
              options={generoOptions}
              value={genero}
              onChange={(val) => setGenero(String(val))}
              required
              disabled={loading}
            />
          </div>

          <hr className="border-tm-border" />

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-tm-base font-semibold text-tm-fg">
                <IconMapPin size={18} className="text-tm-fg-muted" />
                Endereço
              </span>
            </div>

            <div className="animate-in fade-in slide-in-from-top-2">
              <AddressSelector
                value={enderecoNacional}
                onChange={setEnderecoNacional}
                disabled={loading}
              />
            </div>
          </div>

          {submitError && (
            <div className="rounded-tm-sm bg-tm-danger-bg p-3 text-tm-sm font-medium text-tm-danger-fg animate-in fade-in">
              {submitError}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2.5 border-t border-tm-border pt-4">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" icon={<IconCheck size={16} />} disabled={loading}>
              {loading ? 'Salvando...' : 'Criar paciente'}
            </Button>
          </div>
          
        </form>
      </Card>
    </div>
  )
}