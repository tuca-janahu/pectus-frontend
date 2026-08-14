import { IconButton } from '../components/ui'
import { IconClose } from '../components/icons'
import type { Notification } from '../data/notifications'

export interface NotificationsDrawerProps {
  open: boolean
  onClose: () => void
  items: Notification[]
  onMark: (id: string) => void
}

export function NotificationsDrawer({ open, onClose, items, onMark }: NotificationsDrawerProps) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgb(15 23 42 / .35)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .25s ease',
          zIndex: 50,
        }}
      />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(380px, 100vw)',
          background: 'var(--tm-surface)',
          boxShadow: '-12px 0 40px rgb(15 23 42 / .15)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .3s cubic-bezier(.2,.8,.2,1)',
          zIndex: 51,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 20px 16px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--tm-border)',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--tm-fg)' }}>Notificações</div>
            <div style={{ fontSize: 12, color: 'var(--tm-fg-subtle)' }}>
              {items.filter((n) => n.unread).length} não lidas
            </div>
          </div>
          <IconButton icon={<IconClose size={20} />} label="Fechar" onClick={onClose} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => onMark(n.id)}
              style={{
                padding: 14,
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                background: n.unread ? 'color-mix(in oklch, var(--tm-primary) 6%, var(--tm-surface))' : 'transparent',
                transition: 'background .15s',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  marginTop: 6,
                  background: n.unread ? 'var(--tm-primary)' : 'var(--tm-border)',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tm-fg)' }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--tm-fg-muted)', marginTop: 2 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: 'var(--tm-fg-subtle)', marginTop: 6 }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
