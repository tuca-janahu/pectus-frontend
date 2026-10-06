import { useEffect, useRef, useState, useCallback, type ChangeEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Avatar, Card, Button } from '../../components/ui'
import type { AvatarColor } from '../../components/ui'
import {
  IconUser,
  IconActivity,
  IconMapPin,
  IconCamera,
  IconArrowLeft,
  IconPhone,
  IconCalendar,
  IconEdit,
  IconPlus,
} from '../../components/icons'
import { useAuth } from '../../auth/AuthContext'
import { getPaciente, listPacientes, uploadPacienteFoto, type PacienteResumo, ApiError } from '../../lib/api'
import { toastError, toastSuccess } from '../../lib/toast'
import { PatientForm } from '../../components/pacientes/PatientForm'

const AVATAR_COLORS: AvatarColor[] = ['sky', 'teal', 'violet', 'rose', 'amber']
const FOTO_MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
const FOTO_MAX_BYTES = 8 * 1024 * 1024

function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return '?'
}

function formatarGenero(genero?: string | null): string {
  if (!genero) return 'Não informado'
  const map: Record<string, string> = {
    MASCULINO: 'Masculino',
    FEMININO: 'Feminino',
    OUTRO: 'Outro',
  }
  return map[genero.toUpperCase()] ?? genero
}

function calcularIdade(dataNascimento?: string | null): string {
  if (!dataNascimento) return 'Idade não informada'
  const nascimento = new Date(dataNascimento)
  if (isNaN(nascimento.getTime())) return 'Idade não informada'
  const hoje = new Date()
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--
  }
  return `${idade} anos`
}

function formatarData(dataIso?: string | null): string {
  if (!dataIso) return 'Não informada'
  const d = new Date(dataIso)
  if (isNaN(d.getTime())) return 'Não informada'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(d)
}

function formatarCpf(cpf?: string | null): string {
  if (!cpf) return 'Não informado'
  const limpo = cpf.replace(/\D/g, '')
  if (limpo.length !== 11) return cpf
  return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatarTelefone(tel?: string | null): string {
  if (!tel) return 'Não informado'
  const limpo = tel.replace(/\D/g, '')
  if (limpo.length === 11) return limpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (limpo.length === 10) return limpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return tel
}

export function PacienteDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { accessToken } = useAuth()

  const [paciente, setPaciente] = useState<PacienteResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const fotoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    }
  }, [fotoPreview])

  const carregarPaciente = useCallback(async () => {
    if (!accessToken || !id) return
    setLoading(true)
    try {
      const res = await getPaciente(accessToken, Number(id))
      setPaciente(res.paciente)
    } catch (err) {
      try {
        const { pacientes } = await listPacientes(accessToken)
        const encontrado = pacientes.find((p) => p.id === Number(id))
        setPaciente(encontrado ?? null)
      } catch {
        toastError('Erro ao carregar dados do paciente.')
      }
    } finally {
      setLoading(false)
    }
  }, [accessToken, id])

  useEffect(() => {
    carregarPaciente()
  }, [carregarPaciente])

  const handleTrocarFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !accessToken || !paciente) return

    if (!FOTO_MIME_PERMITIDOS.includes(file.type)) {
      toastError('Formato de imagem inválido. Use JPEG, PNG ou WEBP.')
      return
    }
    if (file.size > FOTO_MAX_BYTES) {
      toastError('A imagem não pode ultrapassar 8MB.')
      return
    }

    const preview = URL.createObjectURL(file)
    setFotoPreview(preview)
    setUploadingFoto(true)

    try {
      const { paciente: atualizado } = await uploadPacienteFoto(accessToken, paciente.id, file)
      setPaciente(atualizado)
      toastSuccess('Foto atualizada com sucesso!')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Não foi possível atualizar a foto.'
      toastError(msg)
      setFotoPreview(null)
    } finally {
      setUploadingFoto(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-tm-sm text-tm-fg-muted">Carregando dados do paciente...</span>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-tm-fg">
        <span className="text-tm-base font-medium text-tm-fg-muted">Paciente não encontrado.</span>
        <Button variant="secondary" icon={<IconArrowLeft size={16} />} onClick={() => navigate('/pacientes')}>
          Voltar para pacientes
        </Button>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-6 text-tm-fg">
        <PatientForm
          paciente={paciente}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false)
            carregarPaciente()
          }}
        />
      </div>
    )
  }

  const avatarColor = AVATAR_COLORS[paciente.id % AVATAR_COLORS.length]
  const imagemSrc = fotoPreview ?? paciente.fotoUrl ?? undefined
  const telefoneContato = paciente.telefones?.[0]?.telefone

  return (
    <div className="flex flex-col gap-6 text-tm-fg">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/pacientes')}
          className="inline-flex items-center gap-2 rounded-tm-sm text-tm-sm font-medium text-tm-fg-muted transition-colors hover:text-tm-primary"
        >
          <IconArrowLeft size={16} />
          Voltar para a lista de pacientes
        </button>
        
        <Button variant="secondary" icon={<IconEdit size={16} />} onClick={() => setIsEditing(true)}>
          Editar paciente
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card padded={false}>
            <div className="overflow-hidden">
              <div className="flex flex-col items-center border-b border-tm-border p-6 text-center">
                <div className="relative mb-4">
                  <Avatar size={96} src={imagemSrc} color={avatarColor} initials={obterIniciais(paciente.nome)} ring />
                  <button
                    type="button"
                    onClick={() => fotoInputRef.current?.click()}
                    disabled={uploadingFoto}
                    className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-tm-surface bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white shadow-tm-card transition hover:opacity-90 disabled:opacity-60"
                    title="Alterar foto"
                  >
                    <IconCamera size={16} />
                  </button>
                  <input ref={fotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleTrocarFoto} disabled={uploadingFoto} />
                </div>

                <h2 className="text-tm-lg font-bold text-tm-fg">{paciente.nome}</h2>
                <span className="text-tm-sm text-tm-fg-muted">
                  {calcularIdade(paciente.dataNascimento)} • {formatarGenero(paciente.genero)}
                </span>
              </div>

              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3 text-tm-sm text-tm-fg">
                  <IconPhone size={18} className="shrink-0 text-tm-fg-muted" />
                  <span>{formatarTelefone(telefoneContato)}</span>
                </div>
                <div className="flex items-center gap-3 text-tm-sm text-tm-fg">
                  <IconMapPin size={18} className="shrink-0 text-tm-fg-muted" />
                  <span>
                    {paciente.municipio ? `${paciente.municipio.nome} - ${paciente.municipio.estado?.sigla ?? ''}` : 'Localidade não informada'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-tm-sm text-tm-fg">
                  <IconCalendar size={18} className="shrink-0 text-tm-fg-muted" />
                  <span>Nascimento: {formatarData(paciente.dataNascimento)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <div className="mb-4 flex items-center gap-2 border-b border-tm-border pb-3">
              <IconUser size={20} className="text-tm-primary" />
              <h3 className="text-tm-base font-semibold text-tm-fg">Informações Cadastrais</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-tm-xs font-semibold uppercase text-tm-fg-muted">Nome Completo</span>
                <span className="text-tm-sm font-medium text-tm-fg">{paciente.nome}</span>
              </div>
              <div>
                <span className="block text-tm-xs font-semibold uppercase text-tm-fg-muted">Documento (CPF)</span>
                <span className="text-tm-sm font-medium text-tm-fg">{formatarCpf(paciente.cpf)}</span>
              </div>
              <div>
                <span className="block text-tm-xs font-semibold uppercase text-tm-fg-muted">Data de Nascimento</span>
                <span className="text-tm-sm font-medium text-tm-fg">
                  {formatarData(paciente.dataNascimento)} ({calcularIdade(paciente.dataNascimento)})
                </span>
              </div>
              <div>
                <span className="block text-tm-xs font-semibold uppercase text-tm-fg-muted">Gênero</span>
                <span className="text-tm-sm font-medium text-tm-fg">{formatarGenero(paciente.genero)}</span>
              </div>
              <div>
                <span className="block text-tm-xs font-semibold uppercase text-tm-fg-muted">Localidade</span>
                <span className="text-tm-sm font-medium text-tm-fg">
                  {paciente.municipio ? `${paciente.municipio.nome} (${paciente.municipio.estado?.sigla ?? ''})` : 'Não informada'}
                </span>
              </div>
              <div>
                <span className="block text-tm-xs font-semibold uppercase text-tm-fg-muted">Data de Registro</span>
                <span className="text-tm-sm font-medium text-tm-fg">{formatarData(paciente.criadoEm)}</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between border-b border-tm-border pb-3">
              <div className="flex items-center gap-2">
                <IconActivity size={20} className="text-tm-primary" />
                <h3 className="text-tm-base font-semibold text-tm-fg">Fichas e Atendimentos</h3>
              </div>
              <Button size="sm" icon={<IconPlus size={16} />} onClick={() => console.log('Nova Ficha')}>
                Nova ficha
              </Button>
            </div>
            <p className="text-tm-sm text-tm-fg-muted">Nenhuma ficha registrada até o momento.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}