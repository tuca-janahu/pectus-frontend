import type { CSSProperties } from 'react'

export type AvatarColor = 'sky' | 'teal' | 'violet' | 'rose' | 'amber'

const COLOR_VARS: Record<AvatarColor, { bg: string; fg: string }> = {
  sky: { bg: 'var(--tm-avatar-sky-bg)', fg: 'var(--tm-avatar-sky-fg)' },
  teal: { bg: 'var(--tm-avatar-teal-bg)', fg: 'var(--tm-avatar-teal-fg)' },
  violet: { bg: 'var(--tm-avatar-violet-bg)', fg: 'var(--tm-avatar-violet-fg)' },
  rose: { bg: 'var(--tm-avatar-rose-bg)', fg: 'var(--tm-avatar-rose-fg)' },
  amber: { bg: 'var(--tm-avatar-amber-bg)', fg: 'var(--tm-avatar-amber-fg)' },
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
  const c = COLOR_VARS[color] ?? COLOR_VARS.sky
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: src ? `center/cover url(${src})` : c.bg,
        color: c.fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: size * 0.38,
        letterSpacing: '0.01em',
        flexShrink: 0,
        boxShadow: ring ? '0 0 0 3px rgb(255 255 255 / .25), 0 0 0 4px var(--tm-primary)' : undefined,
        ...style,
      }}
    >
      {!src && initials}
    </div>
  )
}
