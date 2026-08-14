export type FichaStatus = 'agendada' | 'concluida' | 'cancelada' | 'pendente'

const STATUS_MAP: Record<FichaStatus, { label: string; bg: string; fg: string; dot: string }> = {
  agendada: {
    label: 'Agendada',
    bg: 'var(--tm-status-agendada-bg)',
    fg: 'var(--tm-status-agendada-fg)',
    dot: 'var(--tm-status-agendada-dot)',
  },
  concluida: {
    label: 'Concluída',
    bg: 'var(--tm-status-concluida-bg)',
    fg: 'var(--tm-status-concluida-fg)',
    dot: 'var(--tm-status-concluida-dot)',
  },
  cancelada: {
    label: 'Cancelada',
    bg: 'var(--tm-status-cancelada-bg)',
    fg: 'var(--tm-status-cancelada-fg)',
    dot: 'var(--tm-status-cancelada-dot)',
  },
  pendente: {
    label: 'Pendente',
    bg: 'var(--tm-status-pendente-bg)',
    fg: 'var(--tm-status-pendente-fg)',
    dot: 'var(--tm-status-pendente-dot)',
  },
}

export interface StatusBadgeProps {
  status: FichaStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.agendada
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '-0.005em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}
