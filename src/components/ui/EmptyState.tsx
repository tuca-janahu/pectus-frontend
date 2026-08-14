import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        textAlign: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'color-mix(in oklch, var(--tm-primary) 8%, var(--tm-surface-2))',
          color: 'var(--tm-primary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--tm-fg)' }}>{title}</div>
      {body && <div style={{ fontSize: 13, color: 'var(--tm-fg-muted)', maxWidth: 260 }}>{body}</div>}
      {action}
    </div>
  )
}
