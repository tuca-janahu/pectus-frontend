import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'

export interface CardProps {
  children?: ReactNode
  style?: CSSProperties
  padded?: boolean
  hover?: boolean
  onClick?: MouseEventHandler<HTMLDivElement>
}

export function Card({ children, style, padded = true, hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--tm-surface)',
        border: '1px solid var(--tm-border)',
        borderRadius: 'var(--tm-radius-card)',
        padding: padded ? 20 : 0,
        boxShadow: 'var(--tm-shadow-card)',
        transition: 'all .2s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      onMouseEnter={
        hover
          ? (e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--tm-shadow-card-hover)'
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--tm-shadow-card)'
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}
