import { TM_NAV_ITEMS, type RouteId } from './navItems'

export interface MobileNavProps {
  route: RouteId
  onNavigate: (route: RouteId) => void
}

export function MobileNav({ route, onNavigate }: MobileNavProps) {
  return (
    <nav
      style={{
        background: 'var(--tm-surface)',
        borderTop: '1px solid var(--tm-border)',
        display: 'grid',
        gridTemplateColumns: `repeat(${TM_NAV_ITEMS.length}, 1fr)`,
        padding: '6px 4px 8px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        position: 'sticky',
        bottom: 0,
        zIndex: 5,
      }}
    >
      {TM_NAV_ITEMS.map((item) => {
        const active = route === item.id
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 4px',
              background: 'transparent',
              border: 'none',
              color: active ? 'var(--tm-primary)' : 'var(--tm-fg-subtle)',
              fontSize: 11,
              fontWeight: active ? 600 : 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all .15s ease',
              position: 'relative',
            }}
          >
            {active && (
              <span
                style={{
                  position: 'absolute',
                  top: -6,
                  width: 24,
                  height: 3,
                  background: 'var(--tm-primary)',
                  borderRadius: 999,
                }}
              />
            )}
            {item.icon}
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
