import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { IconEye, IconEyeOff, IconGoogle, IconLock, IconMail, IconShield } from '../../components/icons'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../lib/api'
import { toastError, toastSuccess } from '../../lib/toast'
import { AuthShell } from './AuthShell'
import { useGoogleLogin } from '@react-oauth/google'

interface LoginLocationState {
  from?: { pathname: string }
}

interface GoogleAuthButtonProps {
  onSuccess: (code: string) => Promise<void>
  onError: (msg: string) => void
  disabled?: boolean
}

function GoogleAuthButton({ onSuccess, onError, disabled }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false)

  const loginWithGoogle = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      setLoading(true)
      try {
        await onSuccess(codeResponse.code)
      } finally {
        setLoading(false)
      }
    },
    onError: () => onError('Autenticação com o Google cancelada ou indisponível.'),
  })

  return (
    <button
      type="button"
      onClick={() => loginWithGoogle()}
      disabled={disabled || loading}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-tm-button border-[1.5px] border-tm-border bg-tm-surface text-[15px] font-semibold tracking-[-0.005em] text-tm-fg transition-colors hover:bg-tm-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <IconGoogle size={20} />
      {loading ? 'Conectando...' : 'Entrar com o Google'}
    </button>
  )
}

export function LoginPage() {
  const { status, login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  if (status === 'authenticated') {
    const from = (location.state as LoginLocationState | null)?.from
    return <Navigate to={from?.pathname ?? '/'} replace />
  }

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setFormError('')
    setLoading(true)
    try {
      await login(email, password, remember)
      toastSuccess('Login realizado com sucesso!')
      const from = (location.state as LoginLocationState | null)?.from
      navigate(from?.pathname ?? '/', { replace: true })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.'
      setFormError(message)
      toastError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (code: string) => {
    setFormError('')
    try {
      await loginWithGoogle(code)
      toastSuccess('Login realizado com sucesso!')
      const from = (location.state as LoginLocationState | null)?.from
      navigate(from?.pathname ?? '/', { replace: true })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Falha na autenticação via Google.'
      setFormError(message)
      toastError(message)
    }
  }

  return (
    <AuthShell title="Entre na sua conta" subtitle="Acesse seu painel de fichas epicríticas">
      <form onSubmit={submit} className="flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-center text-sm text-red-600">
            {formError}
          </div>
        )}
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          icon={<IconMail size={18} />}
          autoComplete="email"
          required
        />
        <Input
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={<IconLock size={18} />}
          autoComplete="current-password"
          required
          error={formError || undefined}
          iconRight={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="inline-flex cursor-pointer border-none bg-transparent p-1 text-tm-fg-subtle"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          }
        />
        <div className="flex items-center justify-between text-tm-base">
          <label className="flex cursor-pointer items-center gap-2 text-tm-fg-muted">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-tm-primary"
            />
            Lembrar
          </label>
          <Link to="/esqueci-senha" className="font-semibold text-tm-primary no-underline">
            Esqueci a senha
          </Link>
        </div>
        <Button type="submit" size="lg" full disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
        <div className="my-1 flex items-center gap-3">
          <div className="h-px flex-1 bg-tm-border" />
          <span className="text-tm-sm text-tm-fg-subtle">ou</span>
          <div className="h-px flex-1 bg-tm-border" />
        </div>
        <GoogleAuthButton 
          onSuccess={handleGoogleSuccess}
          onError={(msg) => setFormError(msg)}
          disabled={loading}/>
        <div className="flex items-center justify-center gap-1.5 text-tm-sm text-tm-fg-subtle">
          <IconShield size={14} style={{ color: 'oklch(0.58 0.13 155)' }} />
          Acesso autenticado e protegido
        </div>
        <div className="text-center text-[12.5px] leading-[1.5] text-tm-fg-subtle">
          As contas são criadas pela administração da clínica.
          <br />
          Fale com o seu administrador para receber acesso.
        </div>
      </form>
    </AuthShell>
  )
}
