import type { ReactNode } from 'react'
import { IconButton } from '../components/ui'
import { IconBell, IconMenu } from '../components/icons'

export interface TopBarProps {
  title: string
  subtitle?: string
  onMenu?: () => void
  onNotifications?: () => void
  notificationCount?: number
  gradient?: boolean
  dense?: boolean
  children?: ReactNode
}

export function TopBar({
  title,
  subtitle,
  onMenu,
  onNotifications,
  notificationCount = 0,
  gradient = true,
  dense = false,
  children,
}: TopBarProps) {
  return (
    <header
      className={`relative overflow-hidden ${dense ? 'px-5 py-3.5' : 'px-6 pt-5 pb-6'} ${
        gradient
          ? 'bg-[linear-gradient(135deg,var(--tm-primary)_0%,var(--tm-primary-deep)_100%)] text-white'
          : 'border-b border-tm-border bg-tm-surface text-tm-fg'
      }`}
    >
      {gradient && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_100%_at_90%_0%,rgb(255_255_255_/_0.15),transparent_60%)] opacity-55"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50 mix-blend-multiply bg-[radial-gradient(60%_80%_at_10%_100%,color-mix(in_oklch,var(--tm-primary-deep)_60%,black)_0%,transparent_60%)]"
          />
        </>
      )}
      <div className="relative z-[1] flex items-center gap-3">
        {onMenu && (
          <div className="nav:hidden">
            <IconButton icon={<IconMenu size={22} />} label="Menu" onClick={onMenu} variant={gradient ? 'onDark' : 'light'} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {subtitle && (
            <div className={`mb-0.5 text-tm-sm font-medium ${gradient ? 'opacity-85' : 'opacity-65'}`}>{subtitle}</div>
          )}
          <div className={`font-bold tracking-[-0.02em] ${dense ? 'text-tm-2xl' : 'text-tm-4xl'}`}>{title}</div>
        </div>
        {onNotifications && (
          <div className="relative">
            <IconButton
              icon={<IconBell size={20} />}
              label="Notificações"
              onClick={onNotifications}
              variant={gradient ? 'onDark' : 'light'}
            />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-tm-primary-deep bg-[oklch(0.65_0.18_25)] px-[5px] text-[10px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </div>
        )}
      </div>
      {children && <div className={`relative z-[1] ${dense ? 'mt-2' : 'mt-4'}`}>{children}</div>}
    </header>
  )
}
