import { useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, TM_NAV_ITEMS, type RouteId } from './shell'
import { TM_NOTIFICATIONS } from './data/notifications'
import { DesignTokensPage } from './pages/DesignTokensPage'
import { ScreenPlaceholder } from './pages/ScreenPlaceholder'

function routeIdFromPathname(pathname: string): RouteId {
  return TM_NAV_ITEMS.find((item) => item.path === pathname)?.id ?? 'home'
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(TM_NOTIFICATIONS)

  const route = routeIdFromPathname(location.pathname)
  const activeItem = TM_NAV_ITEMS.find((item) => item.id === route)!

  return (
    <AppShell
      route={route}
      onNavigate={(id) => {
        const item = TM_NAV_ITEMS.find((i) => i.id === id)
        if (item) navigate(item.path)
      }}
      onLogout={() => {}}
      title={activeItem.label}
      subtitle={activeItem.subtitle}
      notifications={notifications}
      onMarkNotification={(id) =>
        setNotifications((arr) => arr.map((n) => (n.id === id ? { ...n, unread: false } : n)))
      }
    >
      <Routes>
        {TM_NAV_ITEMS.map((item) => (
          <Route
            key={item.id}
            path={item.path}
            element={item.id === 'home' ? <DesignTokensPage /> : <ScreenPlaceholder item={item} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App
