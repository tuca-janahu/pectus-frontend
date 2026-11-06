import type { DashboardResumo, Granularidade, StatusDashboard } from '../../lib/dashboard'

const STATUS: Array<{ id: StatusDashboard; label: string; color: string }> = [
  { id: 'AGENDADA', label: 'Agendados', color: 'var(--tm-status-agendada-dot)' },
  { id: 'EM_PREENCHIMENTO', label: 'Em preenchimento', color: 'var(--tm-status-pendente-dot)' },
  { id: 'CONCLUIDA', label: 'Concluídos', color: 'var(--tm-status-concluida-dot)' },
  { id: 'CANCELADA', label: 'Cancelados', color: 'var(--tm-status-cancelada-dot)' },
]

function labelPeriodo(periodo: string, granularidade: Granularidade) {
  const [ano, mes, dia] = periodo.split('-').map(Number)
  if (granularidade === 'mes') return `${String(mes).padStart(2, '0')}/${String(ano).slice(-2)}`
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
      <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1">
        {STATUS.map((status) => (
          <span key={status.id} className="inline-flex items-center gap-1.5 text-tm-sm text-tm-fg-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: status.color }} />{status.label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex items-end gap-1 border-b border-tm-border pt-5" style={{ height: 176, minWidth: serie.length > 30 ? serie.length * 16 : undefined }}>
          {serie.map((item, index) => {
            const total = STATUS.reduce((soma, status) => soma + item[status.id], 0)
            return (
              <button key={item.periodo} type="button" onClick={() => onSelect(item.periodo)}
                aria-label={`${labelPeriodo(item.periodo, granularidade)}: ${total} atendimentos. Abrir lista.`}
                title={`${labelPeriodo(item.periodo, granularidade)} · ${total} atendimentos\n${STATUS.map((status) => `${status.label}: ${item[status.id]}`).join('\n')}`}
                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-t-sm focus-visible:outline-2 focus-visible:outline-tm-primary">
                <span className="flex w-full max-w-9 flex-col-reverse overflow-hidden rounded-t-[5px] bg-tm-surface-2 transition-opacity group-hover:opacity-75"
                  style={{ height: Math.max(total ? 3 : 1, (total / maior) * 120) }}>
                  {STATUS.map((status) => <span key={status.id} style={{ height: `${total ? (item[status.id] / total) * 100 : 0}%`, background: status.color }} />)}
                </span>
                <span className="h-5 w-full overflow-hidden text-center text-[10px] text-tm-fg-subtle">{index % passo === 0 || index === serie.length - 1 ? labelPeriodo(item.periodo, granularidade) : ''}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function GraficoRosca({
  dados, rotuloTotal,
}: {
  dados: Array<{ label: string; total: number; cor: string }>
  rotuloTotal: string
}) {
  const total = dados.reduce((soma, item) => soma + item.total, 0)
  const raio = 43
  const circunferencia = 2 * Math.PI * raio
  let acumulado = 0

  return (
    <div className="flex flex-col items-center gap-2.5">
      <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0" role="img"
        aria-label={`${rotuloTotal}: ${total}. ${dados.map((item) => `${item.label}: ${item.total}`).join(', ')}`}>
        <circle cx="60" cy="60" r={raio} fill="none" stroke="var(--tm-surface-2)" strokeWidth="12" />
        {total > 0 && dados.map((item) => {
          const comprimento = item.total / total * circunferencia
          const inicio = acumulado
          acumulado += comprimento
          return <circle key={item.label} cx="60" cy="60" r={raio} fill="none"
            stroke={item.cor} strokeWidth="12" strokeDasharray={`${Math.max(0, comprimento - 2)} ${circunferencia}`}
            strokeDashoffset={-inicio} transform="rotate(-90 60 60)">
            <title>{`${item.label}: ${item.total} (${Math.round(item.total / total * 100)}%)`}</title>
          </circle>
        })}
        <text x="60" y="57" textAnchor="middle" fill="var(--tm-fg)" className="font-tm-display text-[24px] font-extrabold">{total}</text>
        <text x="60" y="72" textAnchor="middle" fill="var(--tm-fg-muted)" className="text-[10px]">{rotuloTotal}</text>
      </svg>
      <div className="grid w-full gap-1.5">
        {dados.map((item) => <div key={item.label} className="flex items-center gap-1.5 text-tm-xs">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.cor }} />
          <span className="min-w-0 flex-1 text-tm-fg-muted">{item.label}</span>
          <strong className="text-tm-fg">{item.total}</strong>
          <span className="w-8 text-right text-tm-fg-subtle">{total ? Math.round(item.total / total * 100) : 0}%</span>
        </div>)}
      </div>
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
    return <p className="py-5 text-center text-tm-sm text-tm-fg-muted">Nenhum dado no período.</p>
  }
  return (
    <div className="space-y-1.5">
      {dados.map((item) => {
        const content = (
          <>
            <span className="flex items-center justify-between gap-3 text-tm-sm">
              <span className="truncate font-medium text-tm-fg" title={item.label}>{item.label}</span>
              <strong className="shrink-0 text-tm-fg">{item.total.toLocaleString('pt-BR')}</strong>
            </span>
            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-tm-surface-2">
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
