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

const VARIANTS: Record<IconButtonVariant, string> = {
  ghost: 'bg-transparent text-tm-fg-muted border border-transparent',
  light: 'bg-tm-surface text-tm-fg border border-tm-border',
  onDark: 'bg-[rgb(255_255_255_/_0.14)] text-white border border-[rgb(255_255_255_/_0.22)]',
}

export function IconButton({ icon, label, onClick, size = 36, variant = 'ghost', style }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-tm-sm cursor-pointer transition-all duration-[180ms] ease-in-out ${VARIANTS[variant]}`}
      style={{ width: size, height: size, ...style }}
    >
      {icon}
    </button>
  )
}
