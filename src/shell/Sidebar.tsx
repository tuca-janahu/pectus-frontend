import { Avatar, IconButton } from '../components/ui'
import { IconChevronLeft, IconLogOut, IconMenu, IconStethoscope } from '../components/icons'
import { TM_DOCTOR } from '../data/doctor'
import { TM_NAV_ITEMS, type RouteId } from './navItems'

export interface SidebarProps {
  route: RouteId
  onNavigate: (route: RouteId) => void
  onLogout: () => void
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ route, onNavigate, onLogout, collapsed = false, onToggle }: SidebarProps) {
  return (
    <aside
      style={{
        background: 'var(--tm-surface)',
        borderRight: '1px solid var(--tm-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: collapsed ? '20px 12px' : '24px 16px',
        gap: 4,
        position: 'sticky',
        top: 0,
        height: '100vh',
        transition: 'padding .2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: collapsed ? 10 : 12,
          padding: collapsed ? '0 0 16px' : '6px 4px 18px',
          borderBottom: '1px solid var(--tm-border)',
          marginBottom: 12,
        }}
      >
        {onToggle && (
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            style={{
              order: collapsed ? -1 : 3,
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--tm-fg-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tm-surface-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {collapsed ? <IconMenu size={20} /> : <IconChevronLeft size={20} />}
          </button>
        )}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            flexShrink: 0,
            background: 'linear-gradient(135deg, var(--tm-primary), var(--tm-primary-deep))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <IconStethoscope size={22} />
        </div>
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--tm-fg)', letterSpacing: '-0.01em' }}>
              Traque Med
            </span>
            <span style={{ fontSize: 11, color: 'var(--tm-fg-subtle)', fontWeight: 500 }}>Fichas epicríticas</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {TM_NAV_ITEMS.map((item) => {
          const active = route === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '12px 0' : '11px 12px',
                borderRadius: 10,
                background: active ? 'color-mix(in oklch, var(--tm-primary) 12%, transparent)' : 'transparent',
                color: active ? 'var(--tm-primary-deep)' : 'var(--tm-fg-muted)',
                border: 'none',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'all .15s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--tm-surface-2)'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent'
              }}
            >
              {active && (
                <span
                  style={{
                    position: 'absolute',
                    left: collapsed ? -12 : -16,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    background: 'var(--tm-primary)',
                    borderRadius: '0 3px 3px 0',
                  }}
                />
              )}
              {item.icon}
              {!collapsed && item.label}
            </button>
          )
        })}
      </div>

      {collapsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 8 }}>
          <button
            onClick={() => onNavigate('perfil')}
            title={TM_DOCTOR.name}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
          >
            <Avatar initials={TM_DOCTOR.initials} size={38} />
          </button>
          <IconButton icon={<IconLogOut size={18} />} label="Sair" onClick={onLogout} />
        </div>
      ) : (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: 'var(--tm-surface-2)',
            border: '1px solid var(--tm-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Avatar initials={TM_DOCTOR.initials} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--tm-fg)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {TM_DOCTOR.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--tm-fg-subtle)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {TM_DOCTOR.crm}
            </div>
          </div>
          <IconButton icon={<IconLogOut size={18} />} label="Sair" onClick={onLogout} />
        </div>
      )}
    </aside>
  )
}
