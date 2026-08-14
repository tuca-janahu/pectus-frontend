import { useEffect, useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { TopBar } from './TopBar'
import { NotificationsDrawer } from './NotificationsDrawer'
import type { RouteId } from './navItems'
import type { Notification } from '../data/notifications'
import './shell.css'

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

  return (
    <div className={`tm-app-grid${collapsed ? ' tm-collapsed' : ''}`}>
      <aside className="tm-sidebar" style={{ gridArea: 'sidebar' }}>
        <Sidebar route={route} onNavigate={onNavigate} onLogout={onLogout} collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>

      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgb(15 23 42 / .35)',
              backdropFilter: 'blur(4px)',
              zIndex: 60,
            }}
          />
          <aside
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(280px, 85vw)',
              background: 'var(--tm-surface)',
              zIndex: 61,
              boxShadow: '12px 0 40px rgb(0 0 0 / .2)',
            }}
          >
            <Sidebar route={route} onNavigate={onNavigate} onLogout={onLogout} />
          </aside>
        </>
      )}

      <main>
        <TopBar
          title={title}
          subtitle={subtitle}
          onMenu={() => setSidebarOpen(true)}
          onNotifications={() => setNotifOpen(true)}
          notificationCount={unreadCount}
        />
        <div style={{ padding: 'clamp(16px, 4vw, 32px)' }}>{children}</div>
      </main>

      <nav className="tm-mobnav" style={{ gridArea: 'mobnav' }}>
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
