import { TM_NAV_ITEMS, type RouteId } from './navItems'

export interface MobileNavProps {
  route: RouteId
  onNavigate: (route: RouteId) => void
}

export function MobileNav({ route, onNavigate }: MobileNavProps) {
  return (
    <nav
      className="sticky bottom-0 z-[5] grid border-t border-tm-border bg-tm-surface px-1 pt-1.5"
      style={{
        gridTemplateColumns: `repeat(${TM_NAV_ITEMS.length}, 1fr)`,
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}
    >
      {TM_NAV_ITEMS.map((item) => {
        const active = route === item.id
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`relative flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent px-1 py-2 font-[inherit] text-tm-xs transition-all duration-150 ease-in-out ${
              active ? 'font-semibold text-tm-primary' : 'font-medium text-tm-fg-subtle'
            }`}
          >
            {active && <span className="absolute -top-1.5 h-[3px] w-6 rounded-full bg-tm-primary" />}
            {item.icon}
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
