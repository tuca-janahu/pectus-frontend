import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { IconEye, IconEyeOff, IconGoogle, IconLock, IconMail, IconShield } from '../../components/icons'
import { useAuth } from '../../auth/AuthContext'
import { ApiError } from '../../lib/api'
import { AuthShell } from './AuthShell'

interface LoginLocationState {
  from?: { pathname: string }
}

function GoogleAuthButton() {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Login com Google em breve"
      className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-tm-button border-[1.5px] border-tm-border bg-tm-surface text-[15px] font-semibold tracking-[-0.005em] text-tm-fg-subtle opacity-60"
    >
      <IconGoogle size={20} />
      Entrar com o Google
      <span className="rounded-full bg-tm-surface-2 px-2 py-0.5 text-[11px] font-medium">em breve</span>
    </button>
  )
}

export function LoginPage() {
  const { status, login } = useAuth()
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

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    setLoading(true)
    try {
      await login(email, password, remember)
      const from = (location.state as LoginLocationState | null)?.from
      navigate(from?.pathname ?? '/', { replace: true })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Entre na sua conta" subtitle="Acesse seu painel de fichas epicríticas">
      <form onSubmit={submit} className="flex flex-col gap-4">
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
        <GoogleAuthButton />
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
