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
        className={`fixed inset-0 z-50 bg-[rgb(15_23_42_/_0.35)] backdrop-blur-sm transition-opacity duration-[250ms] ease-in-out ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[51] flex w-[min(380px,100vw)] flex-col bg-tm-surface shadow-[-12px_0_40px_rgb(15_23_42_/_0.15)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center border-b border-tm-border px-5 pt-5 pb-4">
          <div className="flex-1">
            <div className="text-tm-xl font-bold text-tm-fg">Notificações</div>
            <div className="text-tm-sm text-tm-fg-subtle">{items.filter((n) => n.unread).length} não lidas</div>
          </div>
          <IconButton icon={<IconClose size={20} />} label="Fechar" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-auto p-3">
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => onMark(n.id)}
              className={`flex cursor-pointer items-start gap-3 rounded-xl p-3.5 transition-colors duration-150 ${
                n.unread ? 'bg-[color-mix(in_oklch,var(--tm-primary)_6%,var(--tm-surface))]' : 'bg-transparent'
              }`}
            >
              <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.unread ? 'bg-tm-primary' : 'bg-tm-border'}`} />
              <div className="flex-1">
                <div className="text-tm-md font-semibold text-tm-fg">{n.title}</div>
                <div className="mt-0.5 text-tm-base text-tm-fg-muted">{n.body}</div>
                <div className="mt-1.5 text-tm-xs text-tm-fg-subtle">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}
