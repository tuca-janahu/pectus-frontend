import toast, { Toaster } from 'react-hot-toast'

/**
 * Mostra as notificações (toasts) do app. Renderizar uma única vez, perto da
 * raiz (`main.tsx`) — depois é só chamar `toastSuccess`/`toastError`/`toastInfo`
 * de qualquer tela, sem precisar importar mais nada relacionado a estilo.
 */
export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: 'rounded-tm-card shadow-tm-card font-tm-body text-tm-md',
        style: {
          background: 'var(--tm-surface)',
          color: 'var(--tm-fg)',
          border: '1px solid var(--tm-border)',
          padding: '12px 16px',
        },
        success: {
          iconTheme: { primary: 'var(--tm-accent-green-fg)', secondary: '#fff' },
          style: {
            background: 'var(--tm-surface)',
            color: 'var(--tm-fg)',
            border: '1px solid color-mix(in oklch, var(--tm-accent-green-fg) 35%, var(--tm-border))',
          },
        },
        error: {
          iconTheme: { primary: 'var(--tm-danger-fg)', secondary: '#fff' },
          style: {
            background: 'var(--tm-danger-bg)',
            color: 'var(--tm-danger-fg)',
            border: '1px solid var(--tm-danger-border)',
          },
        },
      }}
    />
  )
}

export function toastSuccess(message: string) {
  return toast.success(message)
}

export function toastError(message: string) {
  return toast.error(message)
}

export function toastInfo(message: string) {
  return toast(message)
}

/**
 * Encapsula uma promise de requisição com toasts de loading/sucesso/erro
 * automáticos — útil pra não repetir try/catch+toast em todo CRUD.
 * Ex: toastPromise(createPaciente(token, input), { loading: 'Salvando...', success: 'Paciente criado!', error: 'Erro ao criar paciente.' })
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error: string },
): Promise<T> {
  return toast.promise(promise, messages)
}
