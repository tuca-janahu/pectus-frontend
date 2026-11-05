import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuthUser } from '../lib/api'
import { API_BASE_URL } from '../lib/api'
import type { Notification } from '../data/notifications'
import { toastInfo } from '../lib/toast'

interface NotificacaoSSEPayload {
  id: string
  atendimentoId: number
  antecedenciaMinutos: number
  pacienteNome: string
  dataHoraPrevista: string
}

function formatarHora(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function payloadParaNotificacao(payload: NotificacaoSSEPayload): Notification {
  return {
    id: payload.id,
    title: `Atendimento em ${payload.antecedenciaMinutos}min`,
    body: `${payload.pacienteNome} — ${formatarHora(payload.dataHoraPrevista)}`,
    time: 'agora',
    unread: true,
  }
}

export function useNotificacoesSSE(accessToken: string | null, user: AuthUser | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const sourceRef = useRef<EventSource | null>(null)

  const isMedico = user?.roles?.includes('MEDICO') ?? false
  const notificacaoAtiva = user?.notificacaoAtiva ?? false
  const shouldConnect = isMedico && notificacaoAtiva && !!accessToken

  const connect = useCallback(() => {
    if (!accessToken || !shouldConnect) return

    const url = `${API_BASE_URL}/notificacoes/stream?token=${encodeURIComponent(accessToken)}`
    const source = new EventSource(url)
    sourceRef.current = source

    source.addEventListener('notificacao', (e: MessageEvent) => {
      try {
        const payload: NotificacaoSSEPayload = JSON.parse(e.data)
        const sessionKey = `notif-shown-${payload.id}`
        if (sessionStorage.getItem(sessionKey)) return

        sessionStorage.setItem(sessionKey, '1')
        const notification = payloadParaNotificacao(payload)
        toastInfo(`Atendimento em ${payload.antecedenciaMinutos}min — ${payload.pacienteNome}`)
        setNotifications((prev) => [notification, ...prev])
      } catch {
        // malformed event
      }
    })
  }, [accessToken, shouldConnect])

  const disconnect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close()
      sourceRef.current = null
    }
  }, [])

  // Connect/disconnect based on shouldConnect
  useEffect(() => {
    if (shouldConnect) {
      connect()
    } else {
      disconnect()
    }
    return disconnect
  }, [shouldConnect, connect, disconnect])

  // Pause when tab is hidden, resume on focus
  useEffect(() => {
    if (!shouldConnect) return

    const handleHidden = () => {
      if (document.hidden) {
        disconnect()
      } else {
        connect()
      }
    }

    document.addEventListener('visibilitychange', handleHidden)
    return () => document.removeEventListener('visibilitychange', handleHidden)
  }, [shouldConnect, connect, disconnect])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)))
  }, [])

  return { notifications, markAsRead }
}
