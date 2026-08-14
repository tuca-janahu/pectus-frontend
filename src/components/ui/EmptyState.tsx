import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-9 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--tm-primary)_8%,var(--tm-surface-2))] text-tm-primary text-[28px]">
        {icon}
      </div>
      <div className="text-tm-xl font-semibold text-tm-fg">{title}</div>
      {body && <div className="max-w-[260px] text-tm-base text-tm-fg-muted">{body}</div>}
      {action}
    </div>
  )
}
