export interface Notification {
  id: string
  title: string
  body: string
  time: string
  unread: boolean
}

export const TM_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Nova ficha agendada', body: 'Lia Janahú — Traqueoscopia amanhã às 10:30', time: 'há 2h', unread: true },
  { id: 'n2', title: 'Lembrete de cirurgia', body: 'Sérgio Leão hoje às 12:00', time: 'há 4h', unread: true },
  { id: 'n3', title: 'Ficha concluída', body: 'Marina Costa — Broncoscopia', time: 'ontem', unread: false },
]
