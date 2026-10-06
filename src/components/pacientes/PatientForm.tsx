import { useEffect, useRef, useState, type ChangeEvent, type SyntheticEvent } from 'react'
import { Avatar, Card, Input, Button, IconButton, Dropdown } from '../ui'
import { InputCpf } from '../ui/InputCpf'
import { InputPhone } from '../ui/InputPhone'
import {
  IconUserPlus,
  IconClose,
  IconUser,
  IconActivity,
  IconCheck,
  IconMapPin,
  IconCamera,
  IconEdit,
} from '../icons'
import { AddressSelector, type AddressSelectorValue } from './AddressSelector'
import { useAuth } from '../../auth/AuthContext'
import { createPaciente, updatePaciente, uploadPacienteFoto, ApiError, type PacienteResumo } from '../../lib/api'
import { toastError, toastSuccess } from '../../lib/toast'

const FOTO_MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
const FOTO_MAX_BYTES = 8 * 1024 * 1024

function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return '?'
}

interface PatientFormProps {
  paciente?: PacienteResumo // Adicionado para suportar edição
  onCancel: () => void
  onSuccess?: () => void
}

export function PatientForm({ paciente, onCancel, onSuccess }: PatientFormProps) {
  const { accessToken } = useAuth()
  const isEditing = !!paciente

  const [nome, setNome] = useState(paciente?.nome || '')
  const [documento, setDocumento] = useState(paciente?.cpf || '')
  const [telefone, setTelefone] = useState(paciente?.telefones?.[0]?.telefone || '')
  // O input type="date" espera o formato YYYY-MM-DD
  const [dataNascimento, setDataNascimento] = useState(paciente?.dataNascimento?.split('T')[0] || '')
  const [genero, setGenero] = useState(paciente?.genero || '')

  const [enderecoNacional, setEnderecoNacional] = useState<AddressSelectorValue>({
    estadoId: '', 
    estadoSigla: paciente?.municipio?.estado?.sigla || '',
    municipioId: paciente?.municipio?.codigo || '',
    municipioNome: paciente?.municipio?.nome || '',
  })

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(paciente?.fotoUrl || null)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      // Limpa o preview apenas se for um object URL (novo upload), ignorando URLs normais vindas do backend
      if (fotoPreviewUrl && fotoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fotoPreviewUrl)
      }
    }
  }, [fotoPreviewUrl])

  const selecionarFoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!FOTO_MIME_PERMITIDOS.includes(file.type)) {
      toastError('Formato de imagem não suportado. Use JPEG, PNG ou WEBP.')
      return
    }
    if (file.size > FOTO_MAX_BYTES) {
      toastError('Imagem muito grande. O tamanho máximo é 8MB.')
      return
    }

    if (fotoPreviewUrl && fotoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(fotoPreviewUrl)
    }
    setFotoFile(file)
    setFotoPreviewUrl(URL.createObjectURL(file))
  }

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
      const cpfLimpo = documento.replace(/\D/g, '')
      const telefoneLimpo = telefone.replace(/\D/g, '')
      
      let pacienteId = paciente?.id

      if (isEditing && pacienteId) {
        await updatePaciente(accessToken, pacienteId, {
          nome,
          cpf: cpfLimpo || undefined,
          telefones: telefoneLimpo ? [telefoneLimpo] : [],
          dataNascimento: new Date(dataNascimento).toISOString(),
          genero,
          municipioId: enderecoNacional.municipioId as number,
        })
        toastSuccess(`Paciente atualizado com sucesso.`)
      } else {
        const { paciente: novo } = await createPaciente(accessToken, {
          nome,
          cpf: cpfLimpo || undefined,
          telefones: telefoneLimpo ? [telefoneLimpo] : [],
          dataNascimento: new Date(dataNascimento).toISOString(),
          genero,
          municipioId: enderecoNacional.municipioId as number,
        })
        pacienteId = novo.id
        toastSuccess(`Paciente cadastrado com sucesso.`)
      }

      if (fotoFile && pacienteId) {
        try {
          await uploadPacienteFoto(accessToken, pacienteId, fotoFile)
        } catch {
          toastError('Dados salvos, mas não foi possível enviar a foto.')
        }
      }

      if (onSuccess) onSuccess()
      else onCancel()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro de conexão com o servidor.'
      setSubmitError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card padded={false} style={{ borderColor: 'color-mix(in oklch, var(--tm-primary) 35%, var(--tm-border))' }}>
        <div className="flex items-center gap-3 border-b border-tm-border bg-[color-mix(in_oklch,var(--tm-primary)_7%,var(--tm-surface))] px-5 py-4">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
            {isEditing ? <IconEdit size={20} /> : <IconUserPlus size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">
              {isEditing ? 'Editar paciente' : 'Novo paciente'}
            </div>
            <div className="text-tm-sm text-tm-fg-muted">
              {isEditing ? 'Atualize os dados e a localização do paciente.' : 'Cadastre os dados e a localização do paciente.'}
            </div>
          </div>
          <IconButton icon={<IconClose size={20} />} label="Cancelar" onClick={onCancel} />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-6 p-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar size={64} src={fotoPreviewUrl ?? undefined} initials={obterIniciais(nome || '?')} />
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                disabled={loading}
                className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-tm-surface bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white shadow-tm-card disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Selecionar foto do paciente"
              >
                <IconCamera size={14} />
              </button>
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={selecionarFoto}
                disabled={loading}
              />
            </div>
            <div className="min-w-0">
              <span className="block text-tm-base font-semibold text-tm-fg">Foto do paciente</span>
              <span className="block text-tm-sm text-tm-fg-muted">Opcional. JPEG, PNG ou WEBP, até 8MB.</span>
            </div>
          </div>

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

            <AddressSelector
              value={enderecoNacional}
              onChange={setEnderecoNacional}
              disabled={loading}
            />
          </div>

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
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar paciente' : 'Criar paciente')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}