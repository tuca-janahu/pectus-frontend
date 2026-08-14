import { cloneElement, isValidElement } from 'react'
import { EmptyState } from '../components/ui'
import type { IconProps } from '../components/icons'
import type { NavItem } from '../shell'

export interface ScreenPlaceholderProps {
  item: NavItem
}

export function ScreenPlaceholder({ item }: ScreenPlaceholderProps) {
  const icon = isValidElement<IconProps>(item.icon) ? cloneElement(item.icon, { size: 28 }) : item.icon
  return (
    <EmptyState
      icon={icon}
      title={`Tela "${item.label}" ainda não implementada`}
      body="O shell já roteia até aqui — a implementação desta tela entra em uma task futura do backlog."
    />
  )
}
