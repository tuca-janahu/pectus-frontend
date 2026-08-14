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

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 text-[13px] h-[34px] gap-1.5',
  md: 'px-[18px] py-2.5 text-tm-md h-10 gap-2',
  lg: 'px-6 py-3.5 text-tm-lg h-12 gap-2.5',
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-tm-primary text-white border border-transparent shadow-[0_1px_2px_rgb(15_23_42_/_0.08),inset_0_1px_0_rgb(255_255_255_/_0.14)]',
  secondary: 'bg-tm-surface-2 text-tm-fg border border-tm-border',
  ghost: 'bg-transparent text-tm-fg-muted border border-transparent',
  onDark: 'bg-[rgb(255_255_255_/_0.12)] text-white border border-[rgb(255_255_255_/_0.25)] backdrop-blur',
  light: 'bg-white text-tm-primary-deep border border-transparent shadow-[0_4px_12px_rgb(15_23_42_/_0.12)]',
  danger: 'bg-tm-danger-bg text-tm-danger-fg border border-tm-danger-border',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  type = 'button',
  className,
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      {...rest}
      className={`inline-flex items-center justify-center rounded-tm-button font-semibold tracking-[-0.005em] cursor-pointer transition-all duration-[180ms] ease-in-out font-[inherit] ${full ? 'w-full' : ''} ${SIZES[size]} ${VARIANTS[variant]} ${className ?? ''}`}
      style={style}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  )
}
