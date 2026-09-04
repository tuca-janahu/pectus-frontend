import { Avatar, IconButton } from '../components/ui'
import { IconChevronLeft, IconLogOut, IconMenu, IconStethoscope } from '../components/icons'
import { useAuth } from '../auth/AuthContext'
import { TM_NAV_ITEMS, type RouteId } from './navItems'

export interface SidebarProps {
  route: RouteId
  onNavigate: (route: RouteId) => void
  onLogout: () => void
  collapsed?: boolean
  onToggle?: () => void
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '')).toUpperCase() || '?'
}

export function Sidebar({ route, onNavigate, onLogout, collapsed = false, onToggle }: SidebarProps) {
  const { user } = useAuth()
  const name = user?.nome ?? ''
  const subtitle = user?.medico?.crm ?? (user?.roles.includes('ADMIN') ? 'Administrador' : user?.email ?? '')
  const initials = initialsFromName(name)

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col gap-1 border-r border-tm-border bg-tm-surface transition-[padding] duration-200 ease-in-out ${collapsed ? 'p-3' : 'px-4 py-6'}`}
    >
      <div
        className={`mb-3 flex items-center justify-center border-b border-tm-border ${
          collapsed ? 'flex-col gap-2.5 pb-4' : 'flex-row gap-3 px-1 pt-1.5 pb-[18px]'
        }`}
      >
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border-none bg-transparent text-tm-fg-muted transition-colors duration-150 hover:bg-tm-surface-2 ${
              collapsed ? '-order-1' : 'order-3'
            }`}
          >
            {collapsed ? <IconMenu size={20} /> : <IconChevronLeft size={20} />}
          </button>
        )}
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
          <IconStethoscope size={22} />
        </div>
        {!collapsed && (
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">Traque Med</span>
            <span className="text-tm-xs font-medium text-tm-fg-subtle">Fichas epicríticas</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        {TM_NAV_ITEMS.map((item) => {
          const active = route === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center rounded-[10px] border-none text-left font-[inherit] text-tm-md transition-all duration-150 ease-in-out ${
                collapsed ? 'justify-center gap-0 px-0 py-3' : 'justify-start gap-3 px-3 py-[11px]'
              } ${
                active
                  ? 'cursor-pointer bg-[color-mix(in_oklch,var(--tm-primary)_12%,transparent)] font-semibold text-tm-primary-deep'
                  : 'cursor-pointer bg-transparent font-medium text-tm-fg-muted hover:bg-tm-surface-2'
              }`}
            >
              {active && (
                <span
                  className={`absolute top-2 bottom-2 w-[3px] rounded-r-[3px] bg-tm-primary ${collapsed ? '-left-3' : '-left-4'}`}
                />
              )}
              {item.icon}
              {!collapsed && item.label}
            </button>
          )
        })}
      </div>

      {collapsed ? (
        <div className="flex flex-col items-center gap-2.5 pt-2">
          <button
            onClick={() => onNavigate('perfil')}
            title={name}
            className="cursor-pointer border-none bg-transparent p-0"
          >
            <Avatar initials={initials} size={38} />
          </button>
          <IconButton icon={<IconLogOut size={18} />} label="Sair" onClick={onLogout} />
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl border border-tm-border bg-tm-surface-2 p-3">
          <Avatar initials={initials} size={36} />
          <div className="min-w-0 flex-1">
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-tm-base font-semibold text-tm-fg">
              {name}
            </div>
            <div className="overflow-hidden text-ellipsis whitespace-nowrap text-tm-xs text-tm-fg-subtle">
              {subtitle}
            </div>
          </div>
          <IconButton icon={<IconLogOut size={18} />} label="Sair" onClick={onLogout} />
        </div>
      )}
    </aside>
  )
}
