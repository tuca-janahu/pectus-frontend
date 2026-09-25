import { Link } from 'react-router-dom'
import { Avatar, Card } from '../components/ui'
import type { AvatarColor } from '../components/ui'
import { IconArrowLeft, IconStethoscope } from '../components/icons'
import { CRIADORES } from '../data/creditos'

const AVATAR_COLORS: AvatarColor[] = ['sky', 'teal', 'violet', 'rose', 'amber']

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '')).toUpperCase() || '?'
}

export function CreditsPage() {
  return (
    <div className="min-h-dvh bg-tm-bg px-5 py-10">
      <div className="mx-auto flex max-w-[880px] flex-col gap-9">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-1.5 text-tm-sm font-semibold text-tm-primary no-underline"
        >
          <IconArrowLeft size={14} />
          Voltar
        </Link>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
            <IconStethoscope size={28} />
          </div>
          <div>
            <h1 className="text-tm-4xl font-bold tracking-[-0.02em] text-tm-fg">Créditos</h1>
            <p className="mx-auto mt-2 max-w-[560px] text-tm-md leading-[1.6] text-tm-fg-muted">
              O Pectus é um projeto desenvolvido pela trilha Técnico Gestor, criado para apoiar o
              acompanhamento clínico de pacientes em tratamento de traqueoplastia.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CRIADORES.map((criador, i) => (
            <Card key={criador.nome}>
              <div className="flex flex-col items-center gap-3 text-center">
                <Avatar
                  initials={initialsFromName(criador.nome)}
                  color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                  size={64}
                  src={criador.foto}
                />
                <div>
                  <div className="text-tm-md font-semibold text-tm-fg">{criador.nome}</div>
                  <div className="mt-0.5 text-tm-sm text-tm-fg-muted">{criador.curso}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
