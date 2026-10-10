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
import { getPaciente, uploadPacienteFoto, type PacienteResumo, ApiError } from '../../lib/api'
import { obterIniciais, calcularIdadeAnos } from '../../lib/pacienteFormat'
import { toastError, toastSuccess } from '../../lib/toast'
import { PatientForm } from '../../components/pacientes/PatientForm'
import { FichaCard } from '../../components/fichas/FichaCard'
import { deleteFicha, listFichas, type Ficha } from '../../lib/fichasStore'

const AVATAR_COLORS: AvatarColor[] = ['sky', 'teal', 'violet', 'rose', 'amber']
const FOTO_MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
const FOTO_MAX_BYTES = 8 * 1024 * 1024

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
  return `${calcularIdadeAnos(dataNascimento)} anos`
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
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingFichas, setLoadingFichas] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const fotoInputRef = useRef<HTMLInputElement>(null)
  // Guarda o id da requisição mais recente — se o usuário navegar para outro
  // paciente antes de uma resposta anterior chegar, a resposta desatualizada
  // é descartada em vez de sobrescrever o paciente atual.
  const latestRequestRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview)
    }
  }, [fotoPreview])

  const carregarPaciente = useCallback(async () => {
    if (!accessToken || !id) return
    latestRequestRef.current = id
    const requestId = id
    const numericId = Number(id)

    if (Number.isNaN(numericId)) {
      toastError('Identificador de paciente inválido.')
      setPaciente(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const res = await getPaciente(accessToken, numericId)
      if (latestRequestRef.current !== requestId) return
      setPaciente(res.paciente)
    } catch (err) {
      if (latestRequestRef.current !== requestId) return
      // Um 404 real significa "não existe" — não há necessidade de mostrar
      // erro. Qualquer outra falha (401/403/500/rede) é um problema real que
      // não deve ser disfarçado de "paciente não encontrado".
      if (!(err instanceof ApiError && err.status === 404)) {
        toastError(err instanceof ApiError ? err.message : 'Erro ao carregar dados do paciente.')
      }
      setPaciente(null)
    } finally {
      if (latestRequestRef.current === requestId) setLoading(false)
    }
  }, [accessToken, id])

  const carregarFichas = useCallback(async () => {
    if (!accessToken || !id) return
    setLoadingFichas(true)
    try {
      const lista = await listFichas(accessToken)
      setFichas(
        lista
          .filter((ficha) => ficha.pacienteId === Number(id))
          .sort((a, b) => `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`)),
      )
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Não foi possível carregar as fichas do paciente.')
    } finally {
      setLoadingFichas(false)
    }
  }, [accessToken, id])

  useEffect(() => {
    carregarPaciente()
    carregarFichas()
  }, [carregarPaciente, carregarFichas])

  const abrirNovaFicha = () => {
    const pacienteId = paciente?.id ?? Number(id)
    const retorno = `/pacientes/${pacienteId}`
    navigate(`/fichas/nova?pacienteId=${pacienteId}&retorno=${encodeURIComponent(retorno)}`)
  }

  const editarFicha = (ficha: Ficha) => {
    const retorno = `/pacientes/${paciente?.id ?? id}`
    navigate(`/fichas/${ficha.id}/editar?retorno=${encodeURIComponent(retorno)}`)
  }

  const cancelarFicha = async (ficha: Ficha) => {
    if (!accessToken) return
    try {
      await deleteFicha(accessToken, ficha.id)
      toastSuccess('Ficha cancelada.')
      await carregarFichas()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Não foi possível cancelar a ficha.')
    }
  }

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
      setFotoPreview(null)
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
          onSuccess={(atualizado) => {
            setIsEditing(false)
            setPaciente(atualizado)
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
              <Button size="sm" icon={<IconPlus size={16} />} onClick={abrirNovaFicha}>
                Nova ficha
              </Button>
            </div>
            {loadingFichas ? (
              <p className="text-tm-sm text-tm-fg-muted">Carregando fichas...</p>
            ) : fichas.length === 0 ? (
              <p className="text-tm-sm text-tm-fg-muted">Nenhuma ficha registrada até o momento.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {fichas.map((ficha) => (
                  <div key={ficha.id} className="flex flex-col gap-1.5">
                    <span className="text-tm-xs font-semibold uppercase tracking-wide text-tm-fg-subtle">
                      {formatarData(`${ficha.data}T00:00:00`)}
                    </span>
                    <FichaCard
                      ficha={ficha}
                      pacienteNome={paciente.nome}
                      iniciais={obterIniciais(paciente.nome)}
                      avatarColor={avatarColor}
                      fotoUrl={imagemSrc}
                      onClick={ficha.status === 'agendada' || ficha.status === 'pendente' ? () => editarFicha(ficha) : undefined}
                      onEdit={ficha.status === 'agendada' || ficha.status === 'pendente' ? () => editarFicha(ficha) : undefined}
                      onDelete={ficha.status === 'agendada' || ficha.status === 'pendente' ? () => cancelarFicha(ficha) : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
