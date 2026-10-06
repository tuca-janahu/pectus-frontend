import { Avatar, type AvatarColor } from '../ui'
import { IconChevronRight } from '../icons'

interface PatientCardProps {
  nome: string
  idade: number
  fichas: number
  iniciais: string
  avatarColor?: AvatarColor
  fotoUrl?: string | null
  onClick?: () => void
}

export function PatientCard({
  nome,
  idade,
  fichas,
  iniciais,
  avatarColor = 'sky',
  fotoUrl,
  onClick,
}: PatientCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className="flex cursor-pointer items-center justify-between border border-tm-border bg-tm-surface p-4 shadow-tm-card transition-all hover:shadow-tm-card-hover rounded-tm-card"
    >
      <div className="flex items-center gap-4">
        <Avatar initials={iniciais} color={avatarColor} size={48} src={fotoUrl || undefined} />

        <div>
          <h3 className="font-tm-body text-tm-base font-semibold text-tm-fg">{nome}</h3>
          <p className="font-tm-body text-tm-sm text-tm-fg-muted">
            {idade} anos • {fichas} {fichas === 1 ? 'ficha' : 'fichas'}
          </p>
        </div>
      </div>

      <IconChevronRight className="text-tm-fg-subtle" size={20} />
    </div>
  )
}