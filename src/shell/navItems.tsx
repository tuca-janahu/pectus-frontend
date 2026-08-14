import type { ReactNode } from 'react'
import { IconCalendar, IconChart, IconHome, IconList, IconShield, IconUser, IconUsers } from '../components/icons'

export type RouteId = 'home' | 'dashboard' | 'fichas' | 'calendario' | 'busca' | 'admin' | 'perfil'

export interface NavItem {
  id: RouteId
  label: string
  path: string
  icon: ReactNode
  subtitle?: string
}

export const TM_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Início', path: '/', icon: <IconHome size={20} /> },
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: <IconChart size={20} />,
    subtitle: 'Visão geral da clínica',
  },
  { id: 'fichas', label: 'Fichas', path: '/fichas', icon: <IconList size={20} />, subtitle: 'Fichas epicríticas' },
  {
    id: 'calendario',
    label: 'Calendário',
    path: '/calendario',
    icon: <IconCalendar size={20} />,
    subtitle: 'Agenda e Google Calendar',
  },
  {
    id: 'busca',
    label: 'Pacientes',
    path: '/pacientes',
    icon: <IconUsers size={20} />,
    subtitle: 'Buscar e gerenciar pacientes',
  },
  { id: 'admin', label: 'Admin', path: '/admin', icon: <IconShield size={20} />, subtitle: 'Equipe e permissões' },
  { id: 'perfil', label: 'Perfil', path: '/perfil', icon: <IconUser size={20} /> },
]
