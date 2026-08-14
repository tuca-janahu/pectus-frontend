import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'onDark' | 'light' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconRight?: ReactNode
  full?: boolean
  style?: CSSProperties
}

const SIZES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '8px 14px', fontSize: 13, height: 34, gap: 6 },
  md: { padding: '10px 18px', fontSize: 14, height: 40, gap: 8 },
  lg: { padding: '14px 24px', fontSize: 15, height: 48, gap: 10 },
}

const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--tm-primary)',
    color: 'white',
    border: '1px solid transparent',
    boxShadow: '0 1px 2px rgb(15 23 42 / .08), inset 0 1px 0 rgb(255 255 255 / .14)',
  },
  secondary: {
    background: 'var(--tm-surface-2)',
    color: 'var(--tm-fg)',
    border: '1px solid var(--tm-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--tm-fg-muted)',
    border: '1px solid transparent',
  },
  onDark: {
    background: 'rgb(255 255 255 / .12)',
    color: 'white',
    border: '1px solid rgb(255 255 255 / .25)',
    backdropFilter: 'blur(8px)',
  },
  light: {
    background: 'white',
    color: 'var(--tm-primary-deep)',
    border: '1px solid transparent',
    boxShadow: '0 4px 12px rgb(15 23 42 / .12)',
  },
  danger: {
    background: 'var(--tm-danger-bg)',
    color: 'var(--tm-danger-fg)',
    border: '1px solid var(--tm-danger-border)',
  },
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  type = 'button',
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--tm-radius-button)',
        fontWeight: 600,
        letterSpacing: '-0.005em',
        cursor: 'pointer',
        transition: 'all .18s ease',
        fontFamily: 'inherit',
        width: full ? '100%' : undefined,
        ...SIZES[size],
        ...VARIANTS[variant],
        ...style,
      }}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  )
}
