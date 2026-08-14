export type FichaStatus = 'agendada' | 'concluida' | 'cancelada' | 'pendente'

const STATUS_MAP: Record<FichaStatus, { label: string; classes: string; dotClass: string }> = {
  agendada: {
    label: 'Agendada',
    classes: 'bg-tm-status-agendada-bg text-tm-status-agendada-fg',
    dotClass: 'bg-tm-status-agendada-dot',
  },
  concluida: {
    label: 'Concluída',
    classes: 'bg-tm-status-concluida-bg text-tm-status-concluida-fg',
    dotClass: 'bg-tm-status-concluida-dot',
  },
  cancelada: {
    label: 'Cancelada',
    classes: 'bg-tm-status-cancelada-bg text-tm-status-cancelada-fg',
    dotClass: 'bg-tm-status-cancelada-dot',
  },
  pendente: {
    label: 'Pendente',
    classes: 'bg-tm-status-pendente-bg text-tm-status-pendente-fg',
    dotClass: 'bg-tm-status-pendente-dot',
  },
}

export interface StatusBadgeProps {
  status: FichaStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.agendada
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-tm-sm font-semibold tracking-[-0.005em] ${s.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dotClass}`} />
      {s.label}
    </span>
  )
}
