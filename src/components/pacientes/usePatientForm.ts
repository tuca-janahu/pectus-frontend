import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { createPaciente, updatePaciente, uploadPacienteFoto, type PacienteResumo } from '../../lib/api'
import { toastError } from '../../lib/toast'
import type { AddressSelectorValue } from './AddressSelector'

const FOTO_MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
const FOTO_MAX_BYTES = 8 * 1024 * 1024

export function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return '?'
}

// Estado + lógica de submit do formulário de paciente, extraído de PatientForm
// para ser reutilizado também dentro do formulário de ficha (criar paciente e
// ficha em um único botão, sem duplicar a lógica de cadastro).
export function usePatientForm(paciente?: PacienteResumo) {
  const { accessToken } = useAuth()
  const isEditing = !!paciente

  const [nome, setNome] = useState(paciente?.nome || '')
  const [documento, setDocumento] = useState(paciente?.cpf || '')
  const [telefone, setTelefone] = useState(paciente?.telefones?.[0]?.telefone || '')
  const [dataNascimento, setDataNascimento] = useState(paciente?.dataNascimento?.split('T')[0] || '')
  const [genero, setGenero] = useState(paciente?.genero || '')

  const [enderecoNacional, setEnderecoNacional] = useState<AddressSelectorValue>({
    estadoId: '',
    estadoSigla: paciente?.municipio?.estado?.sigla || '',
    municipioId: paciente?.municipio?.codigo || '',
    municipioNome: paciente?.municipio?.nome || '',
  })

  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(paciente?.fotoUrl || null)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
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

  const validate = (): string | null => {
    if (!enderecoNacional.municipioId) return 'Por favor, selecione o Estado e o Município do paciente.'
    if (!dataNascimento || !genero) return 'Por favor, preencha a data de nascimento e o gênero do paciente.'
    return null
  }

  const submit = async (): Promise<PacienteResumo> => {
    if (!accessToken) throw new Error('Sessão expirada. Faça login novamente.')

    const cpfLimpo = documento.replace(/\D/g, '')
    const telefoneLimpo = telefone.replace(/\D/g, '')

    let pacienteId = paciente?.id
    let resultPaciente: PacienteResumo

    if (isEditing && pacienteId) {
      const { paciente: atualizado } = await updatePaciente(accessToken, pacienteId, {
        nome,
        cpf: cpfLimpo || undefined,
        telefones: telefoneLimpo ? [telefoneLimpo] : [],
        dataNascimento: new Date(dataNascimento).toISOString(),
        genero,
        municipioId: enderecoNacional.municipioId as number,
      })
      resultPaciente = atualizado
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
      resultPaciente = novo
    }

    if (fotoFile && pacienteId) {
      try {
        const { paciente: comFoto } = await uploadPacienteFoto(accessToken, pacienteId, fotoFile)
        resultPaciente = comFoto
      } catch {
        toastError('Dados salvos, mas não foi possível enviar a foto.')
      }
    }

    return resultPaciente
  }

  return {
    isEditing,
    nome, setNome,
    documento, setDocumento,
    telefone, setTelefone,
    dataNascimento, setDataNascimento,
    genero, setGenero,
    enderecoNacional, setEnderecoNacional,
    fotoFile, fotoPreviewUrl, fotoInputRef, selecionarFoto,
    validate, submit,
  }
}

export type PatientFormState = ReturnType<typeof usePatientForm>
