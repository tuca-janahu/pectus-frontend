import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Avatar, Card, Switch } from '../components/ui'
import { IconBell, IconCamera, IconUser } from '../components/icons'
import { useAuth } from '../auth/AuthContext'
import { uploadContaFoto, updateNotificacaoPref } from '../lib/api'
import { toastError, toastPromise } from '../lib/toast'

const FOTO_MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
const FOTO_MAX_BYTES = 8 * 1024 * 1024
const ANTECEDENCIAS_OPCOES = [15, 30, 60]

function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return '?'
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-tm-sm text-tm-fg-muted">{label}</div>
      <div className="text-tm-md font-semibold text-tm-fg">{value}</div>
    </div>
  )
}

export function PerfilPage() {
  const { user, accessToken, refreshUser } = useAuth()

  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(() => user?.notificacaoAtiva ?? false)
  const [antecedencias, setAntecedencias] = useState<number[]>(() => user?.notificacaoAntecedencias ?? [])
  const [salvandoNotif, setSalvandoNotif] = useState(false)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
    }
  }, [fotoPreviewUrl])

  useEffect(() => {
    refreshUser().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync notification prefs from user once loaded
  useEffect(() => {
    if (user) {
      setNotificacoesAtivas(user.notificacaoAtiva ?? false)
      setAntecedencias(user.notificacaoAntecedencias ?? [])
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const salvarNotificacao = async (ativa: boolean, novasAntecedencias: number[]) => {
    if (!accessToken) return
    setSalvandoNotif(true)
    try {
      await updateNotificacaoPref(accessToken, { ativa, antecedencias: novasAntecedencias })
      await refreshUser()
    } catch {
      toastError('Não foi possível salvar as preferências de notificação.')
    } finally {
      setSalvandoNotif(false)
    }
  }

  const toggleNotificacoes = (checked: boolean) => {
    setNotificacoesAtivas(checked)
    salvarNotificacao(checked, antecedencias)
  }

  const toggleAntecedencia = (minutos: number) => {
    const novas = antecedencias.includes(minutos)
      ? antecedencias.filter((a) => a !== minutos)
      : [...antecedencias, minutos]
    setAntecedencias(novas)
    salvarNotificacao(notificacoesAtivas, novas)
  }

  const selecionarFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !accessToken) return

    if (!FOTO_MIME_PERMITIDOS.includes(file.type)) {
      toastError('Formato de imagem não suportado. Use JPEG, PNG ou WEBP.')
      return
    }
    if (file.size > FOTO_MAX_BYTES) {
      toastError('Imagem muito grande. O tamanho máximo é 8MB.')
      return
    }

    if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl)
    setFotoPreviewUrl(URL.createObjectURL(file))
    setEnviandoFoto(true)
    try {
      await toastPromise(uploadContaFoto(accessToken, file), {
        loading: 'Enviando foto...',
        success: 'Foto atualizada!',
        error: 'Não foi possível enviar a foto.',
      })
      await refreshUser()
    } catch {
      // toastPromise já mostrou o erro
    } finally {
      setEnviandoFoto(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 text-tm-fg">
      <header>
        <h1 className="text-tm-3xl font-bold tracking-[-0.01em] text-tm-fg">Perfil</h1>
        <p className="mt-1 text-tm-md text-tm-fg-muted">Seus dados e preferências de conta</p>
      </header>

      <Card padded={false} style={{ overflow: 'hidden', borderColor: 'color-mix(in oklch, var(--tm-primary) 35%, var(--tm-border))' }}>
        <div className="flex items-center gap-3 border-b border-tm-border bg-[color-mix(in_oklch,var(--tm-primary)_7%,var(--tm-surface))] px-5 py-4">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
            <IconUser size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">Dados da conta</div>
            <div className="text-tm-sm text-tm-fg-muted">Suas informações cadastradas</div>
          </div>
        </div>

        <div className="flex flex-col gap-6 p-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar size={84} src={fotoPreviewUrl ?? user?.fotoUrl ?? undefined} initials={obterIniciais(user?.nome || '?')} />
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                disabled={enviandoFoto}
                className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-tm-surface bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white shadow-tm-card disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Selecionar foto de perfil"
              >
                <IconCamera size={14} />
              </button>
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={selecionarFoto}
                disabled={enviandoFoto}
              />
            </div>
            <div className="min-w-0">
              <span className="block text-tm-base font-semibold text-tm-fg">Foto de perfil</span>
              <span className="block text-tm-sm text-tm-fg-muted">JPEG, PNG ou WEBP, até 8MB.</span>
            </div>
          </div>

          <hr className="border-tm-border" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Campo label="Nome" value={user?.nome ?? ''} />
            <Campo label="E-mail" value={user?.email ?? ''} />
            {user?.medico && <Campo label="CRM" value={user.medico.crm} />}
          </div>
        </div>
      </Card>

      <Card padded={false} style={{ overflow: 'hidden', borderColor: 'color-mix(in oklch, var(--tm-primary) 35%, var(--tm-border))' }}>
        <div className="flex items-center gap-3 border-b border-tm-border bg-[color-mix(in_oklch,var(--tm-primary)_7%,var(--tm-surface))] px-5 py-4">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
            <IconBell size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">Notificações</div>
            <div className="text-tm-sm text-tm-fg-muted">Alertas do sistema</div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-tm-md font-semibold text-tm-fg">Ativar notificações</div>
              <div className="text-tm-sm text-tm-fg-muted">Receba alertas sobre atendimentos próximos.</div>
            </div>
            <Switch
              checked={notificacoesAtivas}
              onChange={toggleNotificacoes}
              label="Ativar notificações"
              disabled={salvandoNotif}
            />
          </div>

          {notificacoesAtivas && (
            <div className="flex flex-col gap-2">
              <div className="text-tm-sm font-medium text-tm-fg">Alertar com antecedência de:</div>
              <div className="flex flex-wrap gap-3">
                {ANTECEDENCIAS_OPCOES.map((min) => (
                  <label key={min} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={antecedencias.includes(min)}
                      onChange={() => toggleAntecedencia(min)}
                      disabled={salvandoNotif}
                      className="h-4 w-4 cursor-pointer accent-[var(--tm-primary)]"
                    />
                    <span className="text-tm-sm text-tm-fg">{min} min</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
