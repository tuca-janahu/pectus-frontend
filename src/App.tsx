import { useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, matchPath } from 'react-router-dom'
import { AppShell, TM_NAV_ITEMS, type RouteId } from './shell'
import { HomePage } from './pages/HomePage'
import { DashboardPage } from './pages/DashboardPage'
import { ScreenPlaceholder } from './pages/ScreenPlaceholder'
import { AdminPage } from './pages/AdminPage'
import { LogsPage } from './pages/LogsPage'
import { PerfilPage } from './pages/PerfilPage'
import { LoginPage } from './pages/auth/LoginPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { ActivatePage } from './pages/auth/ActivatePage'
import { RequireAuth } from './auth/RequireAuth'
import { useAuth } from './auth/AuthContext'
import { useNotificacoesSSE } from './hooks/useNotificacoesSSE'
import { PacientesPage } from './pages/pacientes/PacientesPage'
import { PacienteDetailsPage } from './pages/pacientes/PacienteDetailsPage'
import { AtendimentosPage } from './pages/AtendimentosPage'
import { CalendarioPage } from './pages/CalendarioPage'
import { IconSearch, IconFilter } from './components/icons'

function routeIdFromPathname(pathname: string): RouteId {
  if (matchPath('/pacientes/:id', pathname)) return 'busca'
  if (pathname === '/atendimentos' || pathname.startsWith('/atendimentos/')) return 'atendimentos'
  return TM_NAV_ITEMS.find((item) => item.path === pathname)?.id ?? 'home'
}

function RedirecionarFichasAntigas() {
  const location = useLocation()
  const destino = /^\/fichas\/nova(?:\/(?:agendamento|atendimento))?$/.test(location.pathname)
    ? '/atendimentos/novo'
    : location.pathname.replace(/^\/fichas/, '/atendimentos')
  return <Navigate to={`${destino}${location.search}`} replace />
}

function AuthenticatedApp() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user, accessToken } = useAuth()
  const { notifications, markAsRead } = useNotificacoesSSE(accessToken, user)
  const [searchTerm, setSearchTerm] = useState('')
  const [pacientesCount, setPacientesCount] = useState<number | null>(null)
  const [atendimentosCount, setAtendimentosCount] = useState<number | null>(null)

  const isDetailsRoute = Boolean(matchPath('/pacientes/:id', location.pathname))
  const route = routeIdFromPathname(location.pathname)
  const activeItem = TM_NAV_ITEMS.find((item) => item.id === route) ?? TM_NAV_ITEMS[0]
  const isPacientesRoute = route === 'busca' && !isDetailsRoute
  const isAtendimentosRoute = route === 'atendimentos'

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
      title={isDetailsRoute ? 'Prontuário' : activeItem.label}
      subtitle={
        isDetailsRoute
          ? 'Visualização detalhada do paciente'
          : isPacientesRoute
            ? pacientesCount !== null
              ? `${pacientesCount} ${pacientesCount === 1 ? 'cadastrado' : 'cadastrados'}`
              : 'Carregando...'
            : isAtendimentosRoute
              ? atendimentosCount !== null
                ? `${atendimentosCount} ${atendimentosCount === 1 ? 'atendimento registrado' : 'atendimentos registrados'}`
                : 'Carregando...'
              : activeItem.subtitle
      }
      notifications={notifications}
      onMarkNotification={markAsRead}
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
        <Route path="/fichas/*" element={<RedirecionarFichasAntigas />} />
        {TM_NAV_ITEMS.map((item) => (
          <Route
            key={item.id}
            path={item.id === 'atendimentos' ? '/atendimentos/*' : item.path}
            element={
              item.id === 'home' ? (
                <HomePage />
              ) : item.id === 'dashboard' ? (
                <DashboardPage />
              ) : item.id === 'admin' ? (
                <AdminPage />
              ) : item.id === 'busca' ? (
                <PacientesPage
                  searchTerm={searchTerm}
                  onCountChange={setPacientesCount}
                />
              ) : item.id === 'atendimentos' ? (
                <AtendimentosPage onCountChange={setAtendimentosCount} />
              ) : item.id === 'calendario' ? (
                <CalendarioPage />
              ) : item.id === 'logs' ? (
                <LogsPage />
              ) : item.id === 'perfil' ? (
                <PerfilPage />
              ) : (
                <ScreenPlaceholder item={item} />
              )
            }
          />
        ))}

        {/* Rota do Prontuário */}
        <Route path="/pacientes/:id" element={<PacienteDetailsPage />} />

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
