import type { DashboardResumo, Granularidade, StatusDashboard } from '../../lib/dashboard'

const STATUS: Array<{ id: StatusDashboard; label: string; color: string }> = [
  { id: 'AGENDADA', label: 'Agendados', color: 'var(--tm-status-agendada-dot)' },
  { id: 'EM_PREENCHIMENTO', label: 'Em preenchimento', color: 'var(--tm-status-pendente-dot)' },
  { id: 'CONCLUIDA', label: 'Concluídos', color: 'var(--tm-status-concluida-dot)' },
  { id: 'CANCELADA', label: 'Cancelados', color: 'var(--tm-status-cancelada-dot)' },
]

function labelPeriodo(periodo: string, granularidade: Granularidade) {
  const [ano, mes, dia] = periodo.split('-').map(Number)
  if (granularidade === 'mes') return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(new Date(ano, mes - 1, 1))
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
}

export function SerieAtendimentos({
  serie, granularidade, onSelect,
}: {
  serie: DashboardResumo['serieAtendimentos']
  granularidade: Granularidade
  onSelect: (periodo: string) => void
}) {
  const maior = Math.max(1, ...serie.map((item) => STATUS.reduce((soma, status) => soma + item[status.id], 0)))
  const passo = Math.max(1, Math.ceil(serie.length / 12))
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
        {STATUS.map((status) => (
          <span key={status.id} className="inline-flex items-center gap-1.5 text-tm-sm text-tm-fg-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: status.color }} />{status.label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[560px] items-end gap-1 border-b border-tm-border pt-5" style={{ height: 218 }}>
          {serie.map((item, index) => {
            const total = STATUS.reduce((soma, status) => soma + item[status.id], 0)
            return (
              <button key={item.periodo} type="button" onClick={() => onSelect(item.periodo)}
                aria-label={`${labelPeriodo(item.periodo, granularidade)}: ${total} atendimentos. Abrir lista.`}
                className="group relative flex h-full min-w-2 flex-1 flex-col items-center justify-end gap-1 rounded-t-sm focus-visible:outline-2 focus-visible:outline-tm-primary">
                <span className="pointer-events-none absolute bottom-full z-10 mb-2 hidden min-w-36 rounded-tm-sm border border-tm-border bg-tm-surface p-2 text-left text-tm-xs text-tm-fg shadow-tm-card-hover group-hover:block group-focus-visible:block">
                  <strong>{labelPeriodo(item.periodo, granularidade)} · {total}</strong>
                  {STATUS.map((status) => <span key={status.id} className="block">{status.label}: {item[status.id]}</span>)}
                </span>
                <span className="flex w-full max-w-9 flex-col-reverse overflow-hidden rounded-t-[5px] bg-tm-surface-2 transition-opacity group-hover:opacity-75"
                  style={{ height: Math.max(total ? 3 : 1, (total / maior) * 160) }}>
                  {STATUS.map((status) => <span key={status.id} style={{ height: `${total ? (item[status.id] / total) * 100 : 0}%`, background: status.color }} />)}
                </span>
                <span className="h-5 whitespace-nowrap text-[10px] text-tm-fg-subtle">{index % passo === 0 ? labelPeriodo(item.periodo, granularidade) : ''}</span>
              </button>
            )
          })}
        </div>
      </div>
      <p className="mt-2 text-tm-xs text-tm-fg-subtle">Selecione uma coluna para abrir os atendimentos do período.</p>
    </div>
  )
}

export function Barras({
  dados, cor = 'var(--tm-primary)', onSelect,
}: {
  dados: Array<{ label: string; total: number }>
  cor?: string
  onSelect?: (label: string) => void
}) {
  const maior = Math.max(1, ...dados.map((item) => item.total))
  if (!dados.length || dados.every((item) => item.total === 0)) {
    return <p className="py-8 text-center text-tm-md text-tm-fg-muted">Nenhum dado no período selecionado.</p>
  }
  return (
    <div className="space-y-3">
      {dados.map((item) => {
        const content = (
          <>
            <span className="flex items-center justify-between gap-3 text-tm-sm">
              <span className="truncate font-medium text-tm-fg" title={item.label}>{item.label}</span>
              <strong className="shrink-0 text-tm-fg">{item.total.toLocaleString('pt-BR')}</strong>
            </span>
            <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-tm-surface-2">
              <span className="block h-full rounded-full" style={{ width: `${(item.total / maior) * 100}%`, background: cor }} />
            </span>
          </>
        )
        return onSelect ? (
          <button type="button" key={item.label} onClick={() => onSelect(item.label)}
            className="block w-full rounded-tm-sm p-1 text-left hover:bg-tm-surface-2 focus-visible:outline-2 focus-visible:outline-tm-primary"
            aria-label={`${item.label}: ${item.total}. Abrir atendimentos.`}>{content}</button>
        ) : <div key={item.label} className="p-1">{content}</div>
      })}
    </div>
  )
}
