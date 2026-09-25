import { Avatar, type AvatarColor } from '../ui'
import { IconChevronRight } from '../icons'

interface PatientCardProps {
  nome: string
  idade: number
  fichas: number
  iniciais: string
  avatarColor?: AvatarColor
}

export function PatientCard({ nome, idade, fichas, iniciais, avatarColor = 'sky' }: PatientCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-tm-surface rounded-tm-card shadow-tm-card hover:shadow-tm-card-hover border border-tm-border cursor-pointer transition-all">
      <div className="flex items-center gap-4">
        <Avatar initials={iniciais} color={avatarColor} size={48} />

        <div>
          <h3 className="font-tm-body font-semibold text-tm-fg text-tm-base">{nome}</h3>
          <p className="font-tm-body text-tm-sm text-tm-fg-muted">
            {idade} anos • {fichas} {fichas === 1 ? 'ficha' : 'fichas'}
          </p>
        </div>
      </div>

      <IconChevronRight className="text-tm-fg-subtle" size={20} />
    </div>
  )
}
