import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { TopBar } from './TopBar'
import { NotificationsDrawer } from './NotificationsDrawer'
import type { RouteId } from './navItems'
import type { Notification } from '../data/notifications'

const COLLAPSED_STORAGE_KEY = 'tm-sidebar-collapsed'

export interface AppShellProps {
  route: RouteId
  onNavigate: (route: RouteId) => void
  onLogout: () => void
  title: string
  subtitle?: string
  notifications: Notification[]
  onMarkNotification: (id: string) => void
  children?: ReactNode
}

export function AppShell({
  route,
  onNavigate,
  onLogout,
  title,
  subtitle,
  notifications,
  onMarkNotification,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [route])

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, c ? '0' : '1')
      return !c
    })
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  // Sidebar/main columns are set inline (not via a stateful class name)
  // because their exact px widths are a design token, not a Tailwind size scale.
  const navCols = collapsed ? 'nav:grid-cols-[76px_1fr]' : 'nav:grid-cols-[248px_1fr]'

  return (
    <div
      className={`grid min-h-dvh grid-cols-1 grid-rows-[1fr_auto] nav:grid-rows-[1fr] ${navCols} transition-[grid-template-columns] duration-200 ease-in-out`}
    >
      <aside className="hidden nav:flex">
        <Sidebar route={route} onNavigate={onNavigate} onLogout={onLogout} collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-[60] bg-[rgb(15_23_42_/_0.35)] backdrop-blur-sm"
          />
          <aside className="fixed inset-y-0 left-0 z-[61] w-[min(280px,85vw)] bg-tm-surface shadow-[12px_0_40px_rgb(0_0_0_/_0.2)]">
            <Sidebar route={route} onNavigate={onNavigate} onLogout={onLogout} />
          </aside>
        </>
      )}

      <main className="min-w-0">
        <TopBar
          title={title}
          subtitle={subtitle}
          onMenu={() => setSidebarOpen(true)}
          onNotifications={() => setNotifOpen(true)}
          notificationCount={unreadCount}
        />
        <div className="p-[clamp(16px,4vw,32px)]">{children}</div>
      </main>

      <nav className="nav:hidden">
        <MobileNav route={route} onNavigate={onNavigate} />
      </nav>

      <NotificationsDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        items={notifications}
        onMark={onMarkNotification}
      />
    </div>
  )
}
