import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => Promise<void> | void
}

export function ConfirmDialog({ open, title, description, confirmLabel, onCancel, onConfirm }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onCancel()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, loading, onCancel])

  if (!open) return null

  const confirmar = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[rgb(15_23_42_/_0.48)] p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) onCancel()
    }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description"
        className="w-full max-w-md rounded-tm-card border border-tm-border bg-tm-surface p-5 shadow-2xl">
        <h2 id="confirm-title" className="text-tm-xl font-bold text-tm-fg">{title}</h2>
        <p id="confirm-description" className="mt-2 text-tm-md leading-relaxed text-tm-fg-muted">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button autoFocus variant="secondary" onClick={onCancel} disabled={loading}>Voltar</Button>
          <Button variant="danger" onClick={() => void confirmar()} disabled={loading}>
            {loading ? 'Cancelando...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>, document.body,
  )
}
