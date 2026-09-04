import { useState, type FormEvent } from 'react'
import { Button, Card, EmptyState, Input } from '../components/ui'
import { IconActivity, IconCheck, IconLink, IconMail, IconShield, IconUser, IconUserPlus } from '../components/icons'
import { useAuth } from '../auth/AuthContext'
import { createAccount, ApiError, type Papel } from '../lib/api'

interface CreatedAccount {
  nome: string
  email: string
  activationLink: string
  activationExpiresAt: string
}

const ROLE_OPTIONS: { value: Papel; label: string; sub: string }[] = [
  { value: 'ADMIN', label: 'Administrador', sub: 'Acesso total ao sistema' },
  { value: 'MEDICO', label: 'Médico(a)', sub: 'Fichas, pacientes e agenda' },
]

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function AdminPage() {
  const { user, accessToken } = useAuth()
  const isAdmin = user?.roles.includes('ADMIN') ?? false

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [roles, setRoles] = useState<Papel[]>(['MEDICO'])
  const [crm, setCrm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedAccount | null>(null)
  const [copied, setCopied] = useState(false)

  if (!isAdmin) {
    return (
      <EmptyState
        icon={<IconShield size={28} />}
        title="Acesso restrito"
        body="Somente contas com o papel de Administrador podem criar novos acessos."
      />
    )
  }

  const toggleRole = (role: Papel) => {
    setRoles((current) =>
      current.includes(role) ? current.filter((r) => r !== role) : [...current, role],
    )
  }

  const resetForm = () => {
    setNome('')
    setEmail('')
    setRoles(['MEDICO'])
    setCrm('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!accessToken) {
      setError('Sessão expirada. Faça login novamente.')
      return
    }
    if (roles.length === 0) {
      setError('Selecione ao menos uma função.')
      return
    }

    setLoading(true)
    try {
      const result = await createAccount(accessToken, {
        nome,
        email,
        roles,
        medico: roles.includes('MEDICO') ? { crm } : undefined,
      })
      setCreated({
        nome: result.conta.nome,
        email: result.conta.email,
        activationLink: `${window.location.origin}/ativar-conta?token=${result.activationToken}`,
        activationExpiresAt: result.activationExpiresAt,
      })
      setCopied(false)
      resetForm()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar a conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (!created) return
    navigator.clipboard.writeText(created.activationLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-6 text-tm-fg">
      <header>
        <h1 className="text-tm-3xl font-bold tracking-[-0.01em] text-tm-fg">Administração</h1>
        <p className="mt-1 text-tm-md text-tm-fg-muted">Criação de contas e acessos da clínica</p>
      </header>

      {created && (
        <Card style={{ borderColor: 'color-mix(in oklch, oklch(0.62 0.13 155) 40%, var(--tm-border))' }}>
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tm-accent-green-bg text-tm-accent-green-fg">
              <IconCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-tm-md font-semibold text-tm-fg">
                Conta criada para {created.nome} ({created.email})
              </div>
              <div className="mt-1 text-tm-sm text-tm-fg-muted">
                Nenhum e-mail é enviado automaticamente — copie o link abaixo e envie manualmente. Expira em{' '}
                {formatExpiry(created.activationExpiresAt)}.
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-tm-sm border border-tm-border bg-tm-surface-2 px-2.5 py-1.5 text-tm-sm text-tm-fg">
                  {created.activationLink}
                </code>
                <Button type="button" size="sm" variant="secondary" icon={<IconLink size={14} />} onClick={copyLink}>
                  {copied ? 'Copiado!' : 'Copiar link'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card style={{ maxWidth: 640 }}>
        <div className="mb-5 flex items-center gap-3">
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
            <IconUserPlus size={20} />
          </div>
          <div>
            <div className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">Nova conta</div>
            <div className="text-tm-sm text-tm-fg-muted">Crie um acesso para um membro da equipe.</div>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input
            label="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do profissional"
            icon={<IconUser size={18} />}
            required
          />
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@traquemed.com"
            icon={<IconMail size={18} />}
            required
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-tm-base font-semibold text-tm-fg">Função</span>
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map((role) => (
                <label
                  key={role.value}
                  className="flex cursor-pointer items-center gap-3 rounded-tm-input border border-tm-border bg-tm-surface-2 px-3.5 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={roles.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                    className="accent-tm-primary"
                  />
                  <div className="min-w-0">
                    <div className="text-tm-md font-semibold text-tm-fg">{role.label}</div>
                    <div className="text-tm-sm text-tm-fg-muted">{role.sub}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {roles.includes('MEDICO') && (
            <Input
              label="CRM / Registro"
              value={crm}
              onChange={(e) => setCrm(e.target.value)}
              placeholder="CRM/UF 00000"
              icon={<IconActivity size={18} />}
              required
            />
          )}

          {error && <div className="text-tm-sm text-tm-error-text">{error}</div>}

          <Button type="submit" disabled={loading} icon={<IconCheck size={16} />}>
            {loading ? 'Criando...' : 'Criar conta'}
          </Button>
        </form>
      </Card>

      <div className="flex items-start gap-3 rounded-tm-card border border-tm-border bg-tm-surface-2 p-4">
        <IconShield size={20} style={{ color: 'var(--tm-primary)', marginTop: 2 }} />
        <p className="text-tm-sm leading-[1.5] text-tm-fg-muted">
          O cadastro de novos usuários é feito apenas aqui, pela administração. Não há registro público — cada
          acesso é criado internamente e ativado pelo próprio usuário com o link de ativação.
        </p>
      </div>
    </div>
  )
}
