import { useCallback, useEffect, useState, type FormEvent } from 'react'
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
import {
  createAccount,
  listAccounts,
  updateAccount,
  ApiError,
  type ContaResumo,
  type Papel,
} from '../lib/api'

type AccountStatus = 'ativo' | 'pendente' | 'inativo'

interface AdminUser {
  id: number
  nome: string
  email: string
  roles: Papel[]
  crm: string
  status: AccountStatus
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

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '')).toUpperCase() || '?'
}

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function toAdminUser(conta: ContaResumo): AdminUser {
  const status: AccountStatus = conta.inativadoEm ? 'inativo' : conta.ativada ? 'ativo' : 'pendente'
  return {
    id: conta.id,
    nome: conta.nome,
    email: conta.email,
    roles: conta.papeis.map((p) => p.papel),
    crm: conta.medico?.crm ?? '',
    status,
  }
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

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [roles, setRoles] = useState<Papel[]>(['MEDICO'])
  const [crm, setCrm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedAccount | null>(null)
  const [copied, setCopied] = useState(false)

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editRoles, setEditRoles] = useState<Papel[]>([])
  const [editCrm, setEditCrm] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const loadUsers = useCallback(async () => {
    if (!accessToken) return
    setLoadingUsers(true)
    setUsersError('')
    try {
      const result = await listAccounts(accessToken)
      setUsers(result.contas.map(toAdminUser))
    } catch (err) {
      setUsersError(err instanceof ApiError ? err.message : 'Não foi possível carregar a equipe.')
    } finally {
      setLoadingUsers(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (isAdmin) loadUsers()
  }, [isAdmin, loadUsers])

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

  const openForm = () => {
    setEditingUser(null)
    setShowForm(true)
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
      setCopied(false)
      setShowForm(false)
      resetForm()
      await loadUsers()
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

  const openEdit = (target: AdminUser) => {
    setShowForm(false)
    setEditingUser(target)
    setEditNome(target.nome)
    setEditRoles(target.roles)
    setEditCrm(target.crm)
    setEditError('')
  }

  const closeEdit = () => setEditingUser(null)

  const toggleEditRole = (role: Papel) => {
    setEditRoles((current) =>
      current.includes(role) ? current.filter((r) => r !== role) : [...current, role],
    )
  }

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!accessToken || !editingUser) return
    setEditError('')
    if (editRoles.length === 0) {
      setEditError('Selecione ao menos uma função.')
      return
    }

    setEditLoading(true)
    try {
      await updateAccount(accessToken, editingUser.id, {
        nome: editNome,
        roles: editRoles,
        crm: editRoles.includes('MEDICO') ? editCrm : undefined,
      })
      setEditingUser(null)
      await loadUsers()
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Não foi possível salvar as alterações.')
    } finally {
      setEditLoading(false)
    }
  }

  const toggleActive = async () => {
    if (!accessToken || !editingUser) return
    setEditError('')
    setEditLoading(true)
    try {
      await updateAccount(accessToken, editingUser.id, { ativo: editingUser.status === 'inativo' })
      setEditingUser(null)
      await loadUsers()
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Não foi possível alterar o status da conta.')
    } finally {
      setEditLoading(false)
    }
  }

  const isSelf = editingUser !== null && user?.id === editingUser.id

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
          <Button onClick={openForm} icon={<IconUserPlus size={16} />}>
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
                Um e-mail de ativação foi enviado para {created.email}. Se precisar, copie o link abaixo e envie
                manualmente também. Expira em {formatExpiry(created.activationExpiresAt)}.
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

      {editingUser && (
        <Card padded={false} style={{ overflow: 'hidden', borderColor: 'color-mix(in oklch, var(--tm-primary) 35%, var(--tm-border))' }}>
          <div className="flex items-center gap-3 border-b border-tm-border bg-[color-mix(in_oklch,var(--tm-primary)_7%,var(--tm-surface))] px-5 py-4">
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
              <IconSettings size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">Editar usuário</div>
              <div className="text-tm-sm text-tm-fg-muted">{editingUser.email}</div>
            </div>
            <IconButton icon={<IconClose size={20} />} label="Cancelar" onClick={closeEdit} />
          </div>

          <form onSubmit={submitEdit} className="flex flex-col gap-4 p-5">
            <Input
              label="Nome completo"
              value={editNome}
              onChange={(e) => setEditNome(e.target.value)}
              placeholder="Nome do profissional"
              icon={<IconUser size={18} />}
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
                      checked={editRoles.includes(role.value)}
                      onChange={() => toggleEditRole(role.value)}
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

            {editRoles.includes('MEDICO') && (
              <Input
                label="CRM / Registro"
                value={editCrm}
                onChange={(e) => setEditCrm(e.target.value)}
                placeholder="CRM/UF 00000"
                icon={<IconActivity size={18} />}
                required
              />
            )}

            {editError && <div className="text-tm-sm text-tm-error-text">{editError}</div>}

            <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-tm-border pt-4">
              <Button
                type="button"
                variant="danger"
                disabled={editLoading || isSelf}
                title={isSelf ? 'Você não pode desativar sua própria conta.' : undefined}
                onClick={toggleActive}
              >
                {editingUser.status === 'inativo' ? 'Reativar conta' : 'Desativar conta'}
              </Button>
              <div className="flex gap-2.5">
                <Button type="button" variant="secondary" onClick={closeEdit}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editLoading} icon={<IconCheck size={16} />}>
                  {editLoading ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <Card padded={false} style={{ overflow: 'hidden' }}>
        <div className="border-b border-tm-border px-[18px] py-3.5">
          <div className="text-tm-md font-bold tracking-[-0.01em] text-tm-fg">Equipe</div>
          <div className="text-tm-sm text-tm-fg-muted">
            {loadingUsers ? 'Carregando...' : `${users.length} contas no sistema`}
          </div>
        </div>
        {usersError ? (
          <div className="flex flex-col items-start gap-2 p-[18px]">
            <p className="text-tm-sm text-tm-error-text">{usersError}</p>
            <Button type="button" size="sm" variant="secondary" onClick={loadUsers}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div>
            {users.map((u, i) => (
              <div
                key={u.id}
                className={`flex items-center gap-3.5 px-[18px] py-3.5 ${i < users.length - 1 ? 'border-b border-tm-border' : ''}`}
              >
                <Avatar initials={initialsFromName(u.nome)} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size={42} />
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
                <IconButton icon={<IconSettings size={18} />} label="Gerenciar" onClick={() => openEdit(u)} />
              </div>
            ))}
            {users.length === 0 && !loadingUsers && (
              <div className="p-[18px] text-tm-sm text-tm-fg-muted">Nenhuma conta cadastrada ainda.</div>
            )}
          </div>
        )}
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
