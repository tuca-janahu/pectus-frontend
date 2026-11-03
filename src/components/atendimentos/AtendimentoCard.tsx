import { Avatar, Button, IconButton, StatusBadge } from '../ui'
import type { AvatarColor } from '../ui'
import { IconEdit, IconStethoscope, IconTrash } from '../icons'
import type { Atendimento } from '../../lib/atendimentosStore'

interface AtendimentoCardProps {
  atendimento: Atendimento
  pacienteNome?: string
  iniciais?: string
  avatarColor?: AvatarColor
  fotoUrl?: string | null
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onStart?: () => void
  starting?: boolean
}

export function AtendimentoCard({
  atendimento,
  pacienteNome,
  iniciais,
  avatarColor = 'sky',
  fotoUrl,
  onClick,
  onEdit,
  onDelete,
  onStart,
  starting = false,
}: AtendimentoCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className="flex flex-wrap items-stretch gap-3.5 rounded-tm-card border border-tm-border bg-tm-surface p-3.5 shadow-tm-card transition-all hover:border-[color-mix(in_oklch,var(--tm-primary)_35%,var(--tm-border))] hover:shadow-tm-card-hover"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="flex min-w-14 flex-col items-center justify-center gap-0.5 border-r border-tm-border px-2">
        <div className="text-tm-2xl font-bold tracking-[-0.02em] text-tm-fg">{atendimento.hora}</div>
        <div className="text-tm-2xs font-semibold uppercase tracking-wider text-tm-fg-subtle">hrs</div>
      </div>

      <div className="flex min-w-[180px] flex-1 items-center gap-3">
        <Avatar initials={iniciais ?? '?'} color={avatarColor} size={40} src={fotoUrl || undefined} />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <div className="text-tm-lg font-semibold tracking-[-0.005em] text-tm-fg">{pacienteNome}</div>
            <StatusBadge status={atendimento.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-tm-base text-tm-fg-muted">
            <span className="font-medium">{atendimento.procedimento}{atendimento.procedimentoOutro ? ` — ${atendimento.procedimentoOutro}` : ''}</span>
            {atendimento.descricao && <span className="min-w-0 truncate" title={atendimento.descricao}>· {atendimento.descricao}</span>}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-wrap items-center justify-end gap-1 border-t border-tm-border pt-2 sm:w-auto sm:border-0 sm:pt-0">
        {onStart && (
          <Button
            size="sm"
            icon={<IconStethoscope size={16} />}
            disabled={starting}
            onClick={(e) => {
              e.stopPropagation()
              onStart()
            }}
          >
            {starting ? 'Iniciando...' : 'Iniciar atendimento'}
          </Button>
        )}
        {onEdit && (
          <IconButton
            icon={<IconEdit size={17} className="cursor-pointer transition-colors" />}
            label="Editar"
            className="cursor-pointer transition-colors hover:bg-[color-mix(in_oklch,var(--tm-primary)_12%,transparent)] hover:text-tm-primary"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          />
        )}
        {onDelete && (
          <IconButton
            icon={<IconTrash size={17} className="cursor-pointer transition-colors" />}
            label="Cancelar atendimento"
            className="cursor-pointer transition-colors hover:text-tm-danger-fg hover:bg-tm-danger-bg"
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
