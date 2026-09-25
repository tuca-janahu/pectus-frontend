import { useCallback, useEffect, useState } from 'react'
import { Button, Card, EmptyState, Input, Select } from '../components/ui'
import { IconClock, IconSearch, IconShield } from '../components/icons'
import { useAuth } from '../auth/AuthContext'
import { listLogs, ApiError, type LogResumo, type ModuloAuditoria } from '../lib/api'

const LIMIT = 50

const MODULO_LABEL: Record<ModuloAuditoria, string> = {
  AUTENTICACAO: 'Autenticação',
  USUARIOS: 'Usuários',
  PACIENTES: 'Pacientes',
}

const MODULO_CLASSES: Record<ModuloAuditoria, string> = {
  AUTENTICACAO: 'bg-tm-accent-primary-bg text-tm-accent-primary-fg',
  USUARIOS: 'bg-tm-status-pendente-bg text-tm-status-pendente-fg',
  PACIENTES: 'bg-tm-accent-green-bg text-tm-accent-green-fg',
}

const MODULO_OPTIONS = (Object.keys(MODULO_LABEL) as ModuloAuditoria[]).map((value) => ({
  value,
  label: MODULO_LABEL[value],
}))

function ModuloBadge({ modulo }: { modulo: ModuloAuditoria }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-tm-xs font-bold ${MODULO_CLASSES[modulo]}`}
    >
      {MODULO_LABEL[modulo]}
    </span>
  )
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function LogsPage() {
  const { user, accessToken } = useAuth()
  const isAdmin = user?.roles.includes('ADMIN') ?? false

  const [modulo, setModulo] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')

  const [logs, setLogs] = useState<LogResumo[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => setBuscaDebounced(busca), 400)
    return () => clearTimeout(timeout)
  }, [busca])

  const loadLogs = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (!accessToken) return
      if (append) setLoadingMore(true)
      else setLoading(true)
      setError('')
      try {
        const result = await listLogs(accessToken, {
          modulo: (modulo as ModuloAuditoria) || undefined,
          de: de || undefined,
          ate: ate || undefined,
          busca: buscaDebounced || undefined,
          offset: nextOffset,
        })
        setLogs((current) => (append ? [...current, ...result.items] : result.items))
        setTotal(result.total)
        setOffset(nextOffset)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Não foi possível carregar os logs.')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [accessToken, modulo, de, ate, buscaDebounced],
  )

  useEffect(() => {
    if (isAdmin) loadLogs(0, false)
  }, [isAdmin, loadLogs])

  if (!isAdmin) {
    return (
      <EmptyState
        icon={<IconShield size={28} />}
        title="Acesso restrito"
        body="Somente contas com o papel de Administrador podem visualizar os logs de auditoria."
      />
    )
  }

  const temFiltroAtivo = Boolean(modulo || de || ate || busca)

  const limparFiltros = () => {
    setModulo('')
    setDe('')
    setAte('')
    setBusca('')
  }

  const temMais = logs.length < total

  return (
    <div className="flex flex-col gap-6 text-tm-fg">
      <header>
        <h1 className="text-tm-3xl font-bold tracking-[-0.01em] text-tm-fg">Logs de auditoria</h1>
        <p className="mt-1 text-tm-md text-tm-fg-muted">Histórico de ações sensíveis do sistema</p>
      </header>

      <Card>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Módulo"
            value={modulo}
            onChange={setModulo}
            options={MODULO_OPTIONS}
            placeholder="Todos os módulos"
          />
          <Input label="De" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          <Input label="Até" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
          <Input
            label="Buscar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar na descrição..."
            icon={<IconSearch size={18} />}
          />
        </div>
        {temFiltroAtivo && (
          <div className="mt-3 flex justify-end">
            <Button type="button" size="sm" variant="ghost" onClick={limparFiltros}>
              Limpar filtros
            </Button>
          </div>
        )}
      </Card>

      <Card padded={false} style={{ overflow: 'hidden' }}>
        <div className="border-b border-tm-border px-[18px] py-3.5">
          <div className="text-tm-md font-bold tracking-[-0.01em] text-tm-fg">Eventos</div>
          <div className="text-tm-sm text-tm-fg-muted">{loading ? 'Carregando...' : `${total} registros`}</div>
        </div>
        {error ? (
          <div className="flex flex-col items-start gap-2 p-[18px]">
            <p className="text-tm-sm text-tm-error-text">{error}</p>
            <Button type="button" size="sm" variant="secondary" onClick={() => loadLogs(0, false)}>
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => (
              <div
                key={log.id}
                className={`flex items-start gap-3.5 px-[18px] py-3.5 ${i < logs.length - 1 ? 'border-b border-tm-border' : ''}`}
              >
                <ModuloBadge modulo={log.modulo} />
                <div className="min-w-0 flex-1">
                  <div className={`text-tm-md ${log.tipo === 'LOGIN_FALHA' ? 'text-tm-error-text' : 'text-tm-fg'}`}>
                    {log.descricao}
                  </div>
                  <div className="mt-0.5 text-tm-sm text-tm-fg-muted">
                    {log.ator?.nome ?? 'Sistema'} · {formatDateTime(log.criadoEm)}
                  </div>
                </div>
              </div>
            ))}
            {logs.length === 0 && !loading && (
              <div className="flex items-center gap-2 p-[18px] text-tm-sm text-tm-fg-muted">
                <IconClock size={16} />
                Nenhum log encontrado para os filtros selecionados.
              </div>
            )}
          </div>
        )}
        {!error && temMais && (
          <div className="flex justify-center border-t border-tm-border p-4">
            <Button type="button" variant="secondary" size="sm" disabled={loadingMore} onClick={() => loadLogs(offset + LIMIT, true)}>
              {loadingMore ? 'Carregando...' : 'Carregar mais'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
