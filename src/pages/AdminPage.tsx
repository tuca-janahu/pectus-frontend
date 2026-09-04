import { useState, type FormEvent } from 'react'
import { Avatar, Button, Card, EmptyState, IconButton, Input } from '../components/ui'
import type { AvatarColor } from '../components/ui'
import {
  IconActivity,
  IconCheck,
  IconClose,
  IconLink,
  IconMail,
  IconSettings,
  IconShield,
  IconUser,
  IconUserPlus,
} from '../components/icons'
import { useAuth } from '../auth/AuthContext'
import { createAccount, ApiError, type Papel } from '../lib/api'

type AccountStatus = 'ativo' | 'pendente' | 'inativo'

interface AdminUser {
  id: string
  nome: string
  email: string
  roles: Papel[]
  crm: string
  status: AccountStatus
  color: AvatarColor
}

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

const ROLE_LABEL: Record<Papel, string> = { ADMIN: 'Administrador', MEDICO: 'Médico(a)' }

const AVATAR_COLORS: AvatarColor[] = ['sky', 'teal', 'violet', 'rose', 'amber']

// Sem rota de listagem de contas no backend ainda (GET /contas não existe) — lista de exemplo até existir.
const INITIAL_USERS: AdminUser[] = [
  { id: 'u1', nome: 'Camila Ferreira', email: 'camila.ferreira@pectus.com', roles: ['ADMIN'], crm: '', status: 'ativo', color: 'sky' },
  { id: 'u2', nome: 'Rafael Souza', email: 'rafael.souza@pectus.com', roles: ['MEDICO'], crm: 'CRM/AL 23981', status: 'ativo', color: 'violet' },
  { id: 'u3', nome: 'Helena Pires', email: 'helena.pires@pectus.com', roles: ['MEDICO'], crm: 'CRM/PE 55012', status: 'pendente', color: 'amber' },
  { id: 'u4', nome: 'Bruno Lima', email: 'bruno.lima@pectus.com', roles: ['MEDICO', 'ADMIN'], crm: 'CRM/AL 41230', status: 'ativo', color: 'teal' },
]

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '')).toUpperCase() || '?'
}

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const map: Record<AccountStatus, { label: string; classes: string; dot: string }> = {
    ativo: { label: 'Ativo', classes: 'bg-tm-accent-green-bg text-tm-accent-green-fg', dot: 'bg-tm-accent-green-fg' },
    pendente: {
      label: 'Ativação pendente',
      classes: 'bg-tm-status-pendente-bg text-tm-status-pendente-fg',
      dot: 'bg-tm-status-pendente-dot',
    },
    inativo: { label: 'Inativo', classes: 'bg-tm-surface-2 text-tm-fg-subtle', dot: 'bg-tm-fg-subtle' },
  }
  const s = map[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-tm-xs font-bold ${s.classes}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function AdminPage() {
  const { user, accessToken } = useAuth()
  const isAdmin = user?.roles.includes('ADMIN') ?? false

  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS)
  const [showForm, setShowForm] = useState(false)

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
    setError('')
  }

  const cancelForm = () => {
    setShowForm(false)
    resetForm()
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
      setUsers((current) => [
        {
          id: `novo-${Date.now()}`,
          nome: result.conta.nome,
          email: result.conta.email,
          roles,
          crm: roles.includes('MEDICO') ? crm : '',
          status: 'pendente',
          color: AVATAR_COLORS[current.length % AVATAR_COLORS.length],
        },
        ...current,
      ])
      setCopied(false)
      setShowForm(false)
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

  const stats = [
    { label: 'Contas', value: users.length },
    { label: 'Ativas', value: users.filter((u) => u.status === 'ativo').length },
    { label: 'Ativações pendentes', value: users.filter((u) => u.status === 'pendente').length },
  ]

  return (
    <div className="flex flex-col gap-6 text-tm-fg">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-tm-3xl font-bold tracking-[-0.01em] text-tm-fg">Administração</h1>
          <p className="mt-1 text-tm-md text-tm-fg-muted">Contas e acessos da clínica</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} icon={<IconUserPlus size={16} />}>
            Novo usuário
          </Button>
        )}
      </header>

      <div className="flex flex-wrap gap-4">
        {stats.map((s) => (
          <Card key={s.label} style={{ minWidth: 140, flex: '1 1 140px' }}>
            <div className="text-tm-3xl font-bold tracking-[-0.02em] text-tm-fg">{s.value}</div>
            <div className="mt-1 text-tm-sm text-tm-fg-muted">{s.label}</div>
          </Card>
        ))}
      </div>

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

      {showForm && (
        <Card padded={false} style={{ overflow: 'hidden', borderColor: 'color-mix(in oklch, var(--tm-primary) 35%, var(--tm-border))' }}>
          <div className="flex items-center gap-3 border-b border-tm-border bg-[color-mix(in_oklch,var(--tm-primary)_7%,var(--tm-surface))] px-5 py-4">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
              <IconUserPlus size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">Nova conta</div>
              <div className="text-tm-sm text-tm-fg-muted">Crie um acesso para um membro da equipe.</div>
            </div>
            <IconButton icon={<IconClose size={20} />} label="Cancelar" onClick={cancelForm} />
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4 p-5">
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
              placeholder="email@pectus.com"
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

            <div className="flex justify-end gap-2.5 border-t border-tm-border pt-4">
              <Button type="button" variant="secondary" onClick={cancelForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} icon={<IconCheck size={16} />}>
                {loading ? 'Criando...' : 'Criar conta'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card padded={false} style={{ overflow: 'hidden' }}>
        <div className="border-b border-tm-border px-[18px] py-3.5">
          <div className="text-tm-md font-bold tracking-[-0.01em] text-tm-fg">Equipe</div>
          <div className="text-tm-sm text-tm-fg-muted">{users.length} contas no sistema</div>
        </div>
        <div>
          {users.map((u, i) => (
            <div
              key={u.id}
              className={`flex items-center gap-3.5 px-[18px] py-3.5 ${i < users.length - 1 ? 'border-b border-tm-border' : ''}`}
            >
              <Avatar initials={initialsFromName(u.nome)} color={u.color} size={42} />
              <div className="min-w-0 flex-1">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-tm-md font-semibold text-tm-fg">
                  {u.nome}
                </div>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-tm-sm text-tm-fg-muted">
                  {u.email}
                  {u.crm ? ` · ${u.crm}` : ''}
                </div>
              </div>
              <span className="hidden shrink-0 whitespace-nowrap rounded-full bg-tm-surface-2 px-3 py-1 text-tm-xs font-semibold text-tm-fg-muted sm:inline-block">
                {u.roles.map((r) => ROLE_LABEL[r]).join(' + ')}
              </span>
              <AccountStatusBadge status={u.status} />
              <IconButton icon={<IconSettings size={18} />} label="Gerenciar" />
            </div>
          ))}
        </div>
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
