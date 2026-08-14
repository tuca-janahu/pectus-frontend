import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'

export type IconButtonVariant = 'ghost' | 'light' | 'onDark'

export interface IconButtonProps {
  icon: ReactNode
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  size?: number
  variant?: IconButtonVariant
  style?: CSSProperties
}

const VARIANTS: Record<IconButtonVariant, CSSProperties> = {
  ghost: { background: 'transparent', color: 'var(--tm-fg-muted)', border: '1px solid transparent' },
  light: { background: 'var(--tm-surface)', color: 'var(--tm-fg)', border: '1px solid var(--tm-border)' },
  onDark: { background: 'rgb(255 255 255 / .14)', color: 'white', border: '1px solid rgb(255 255 255 / .22)' },
}

export function IconButton({ icon, label, onClick, size = 36, variant = 'ghost', style }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--tm-radius-sm)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all .18s ease',
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {icon}
    </button>
  )
}
