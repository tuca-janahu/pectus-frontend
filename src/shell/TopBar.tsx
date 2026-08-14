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
      style={{
        background: gradient
          ? 'linear-gradient(135deg, var(--tm-primary) 0%, var(--tm-primary-deep) 100%)'
          : 'var(--tm-surface)',
        color: gradient ? 'white' : 'var(--tm-fg)',
        borderBottom: gradient ? 'none' : '1px solid var(--tm-border)',
        padding: dense ? '14px 20px' : '20px 24px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {gradient && (
        <>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.55,
              pointerEvents: 'none',
              background: 'radial-gradient(70% 100% at 90% 0%, rgb(255 255 255 / .15), transparent 60%)',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.5,
              pointerEvents: 'none',
              background:
                'radial-gradient(60% 80% at 10% 100%, color-mix(in oklch, var(--tm-primary-deep) 60%, black) 0%, transparent 60%)',
              mixBlendMode: 'multiply',
            }}
          />
        </>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
        {onMenu && (
          <div className="tm-topbar-menu">
            <IconButton icon={<IconMenu size={22} />} label="Menu" onClick={onMenu} variant={gradient ? 'onDark' : 'light'} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          {subtitle && (
            <div style={{ fontSize: 12, opacity: gradient ? 0.85 : 0.65, fontWeight: 500, marginBottom: 2 }}>
              {subtitle}
            </div>
          )}
          <div style={{ fontSize: dense ? 18 : 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
        </div>
        {onNotifications && (
          <div style={{ position: 'relative' }}>
            <IconButton
              icon={<IconBell size={20} />}
              label="Notificações"
              onClick={onNotifications}
              variant={gradient ? 'onDark' : 'light'}
            />
            {notificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  background: 'oklch(0.65 0.18 25)',
                  color: 'white',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 5px',
                  border: '2px solid var(--tm-primary-deep)',
                }}
              >
                {notificationCount}
              </span>
            )}
          </div>
        )}
      </div>
      {children && <div style={{ position: 'relative', zIndex: 1, marginTop: dense ? 8 : 16 }}>{children}</div>}
    </header>
  )
}
