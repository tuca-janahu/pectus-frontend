import type { CSSProperties } from 'react'

export type AvatarColor = 'sky' | 'teal' | 'violet' | 'rose' | 'amber'

const COLOR_CLASSES: Record<AvatarColor, string> = {
  sky: 'bg-tm-avatar-sky-bg text-tm-avatar-sky-fg',
  teal: 'bg-tm-avatar-teal-bg text-tm-avatar-teal-fg',
  violet: 'bg-tm-avatar-violet-bg text-tm-avatar-violet-fg',
  rose: 'bg-tm-avatar-rose-bg text-tm-avatar-rose-fg',
  amber: 'bg-tm-avatar-amber-bg text-tm-avatar-amber-fg',
}

export interface AvatarProps {
  initials?: string
  color?: AvatarColor
  size?: number
  src?: string
  ring?: boolean
  style?: CSSProperties
}

export function Avatar({ initials, color = 'sky', size = 40, src, ring = false, style }: AvatarProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-[0.01em] ${
        src ? 'bg-cover bg-center' : COLOR_CLASSES[color] ?? COLOR_CLASSES.sky
      } ${ring ? 'shadow-[0_0_0_3px_rgb(255_255_255_/_0.25),0_0_0_4px_var(--tm-primary)]' : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundImage: src ? `url(${src})` : undefined,
        ...style,
      }}
    >
      {!src && initials}
    </div>
  )
}
