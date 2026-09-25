import { useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppShell, TM_NAV_ITEMS, type RouteId } from './shell'
import { TM_NOTIFICATIONS } from './data/notifications'
import { DesignTokensPage } from './pages/DesignTokensPage'
import { ScreenPlaceholder } from './pages/ScreenPlaceholder'
import { AdminPage } from './pages/AdminPage'
import { LoginPage } from './pages/auth/LoginPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { ActivatePage } from './pages/auth/ActivatePage'
import { RequireAuth } from './auth/RequireAuth'
import { useAuth } from './auth/AuthContext'
import { PacientesPage } from './pages/pacientes/PacientesPage'
import { IconSearch, IconFilter } from './components/icons'

function routeIdFromPathname(pathname: string): RouteId {
  return TM_NAV_ITEMS.find((item) => item.path === pathname)?.id ?? 'home'
}

function AuthenticatedApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [notifications, setNotifications] = useState(TM_NOTIFICATIONS)
  const [searchTerm, setSearchTerm] = useState('')
  const [pacientesCount, setPacientesCount] = useState<number | null>(null)

  const route = routeIdFromPathname(location.pathname)
  const activeItem = TM_NAV_ITEMS.find((item) => item.id === route)!
  const isPacientesRoute = route === 'busca'

  return (
    <AppShell
      route={route}
      onNavigate={(id) => {
        const item = TM_NAV_ITEMS.find((i) => i.id === id)
        if (item) navigate(item.path)
      }}
      onLogout={() => {
        logout()
        navigate('/login')
      }}
      title={activeItem.label}
      subtitle={
        isPacientesRoute
          ? pacientesCount !== null
            ? `${pacientesCount} ${pacientesCount === 1 ? 'cadastrado' : 'cadastrados'}`
            : 'Carregando...'
          : activeItem.subtitle
      }
      notifications={notifications}
      onMarkNotification={(id) =>
        setNotifications((arr) => arr.map((n) => (n.id === id ? { ...n, unread: false } : n)))
      }
      topBarContent={
        isPacientesRoute ? (
          <div className="flex gap-3 pt-2 pb-1">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-white/70">
                <IconSearch size={20} />
              </span>
              <input
                type="text"
                placeholder="Buscar por nome..."
                className="w-full rounded-tm-input border border-white/20 bg-white/10 py-3 pl-12 pr-4 font-tm-body text-white placeholder-white/70 transition-all focus:bg-white/20 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="flex shrink-0 items-center justify-center rounded-tm-button border border-white/20 bg-white/10 px-4 py-3 transition-all hover:bg-white/20">
              <IconFilter size={20} className="text-white" />
            </button>
          </div>
        ) : undefined
      }
    >
      <Routes>
        {TM_NAV_ITEMS.map((item) => (
          <Route
            key={item.id}
            path={item.path}
            element={
              item.id === 'home' ? (
                <DesignTokensPage />
              ) : item.id === 'admin' ? (
                <AdminPage />
              ) : item.id === 'busca' ? (
                <PacientesPage 
                  searchTerm={searchTerm} 
                  onCountChange={setPacientesCount} 
                />
              ) : (
                <ScreenPlaceholder item={item} />
              )
            }
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route path="/ativar-conta" element={<ActivatePage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <AuthenticatedApp />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App