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
      className={`bg-tm-surface border border-tm-border rounded-tm-card shadow-tm-card transition-all duration-200 ease-in-out ${padded ? 'p-5' : 'p-0'} ${onClick ? 'cursor-pointer' : 'cursor-default'} ${hover ? 'hover:-translate-y-0.5 hover:shadow-tm-card-hover' : ''}`}
      style={style}
    >
      {children}
    </div>
  )
}
