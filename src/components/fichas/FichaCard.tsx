import { Avatar, IconButton, StatusBadge } from '../ui'
import type { AvatarColor } from '../ui'
import { IconEdit, IconMessage, IconTrash } from '../icons'
import type { Ficha } from '../../lib/fichasStore'

interface FichaCardProps {
  ficha: Ficha
  pacienteNome?: string
  iniciais?: string
  avatarColor?: AvatarColor
  fotoUrl?: string | null
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function FichaCard({
  ficha,
  pacienteNome,
  iniciais,
  avatarColor = 'sky',
  fotoUrl,
  onClick,
  onEdit,
  onDelete,
}: FichaCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className="flex items-stretch gap-3.5 rounded-tm-card border border-tm-border bg-tm-surface p-3.5 shadow-tm-card transition-all hover:border-[color-mix(in_oklch,var(--tm-primary)_35%,var(--tm-border))] hover:shadow-tm-card-hover"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="flex min-w-14 flex-col items-center justify-center gap-0.5 border-r border-tm-border px-2">
        <div className="text-tm-2xl font-bold tracking-[-0.02em] text-tm-fg">{ficha.hora}</div>
        <div className="text-tm-2xs font-semibold uppercase tracking-wider text-tm-fg-subtle">hrs</div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar initials={iniciais ?? '?'} color={avatarColor} size={40} src={fotoUrl || undefined} />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <div className="text-tm-lg font-semibold tracking-[-0.005em] text-tm-fg">{pacienteNome}</div>
            <StatusBadge status={ficha.status} />
          </div>
          <div className="flex items-center gap-2 overflow-hidden text-tm-base text-tm-fg-muted">
            <span className="truncate">{ficha.procedimento}</span>
            {ficha.modo === 'ao-vivo' && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-tm-accent-green-bg px-2 py-0.5 text-tm-xs font-bold text-tm-accent-green-fg">
                <IconMessage size={11} /> Ao vivo
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {onEdit && (
          <IconButton
            icon={<IconEdit size={17} />}
            label="Editar"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          />
        )}
        {onDelete && (
          <IconButton
            icon={<IconTrash size={17} />}
            label="Cancelar ficha"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          />
        )}
      </div>
    </div>
  )
}
