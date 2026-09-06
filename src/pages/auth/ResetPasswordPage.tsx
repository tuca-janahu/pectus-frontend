import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { IconCheck, IconEye, IconEyeOff, IconLock } from '../../components/icons'
import { resetPassword, ApiError } from '../../lib/api'
import { AuthShell } from './AuthShell'

const MIN_PASSWORD_LENGTH = 6

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <AuthShell title="Link inválido" subtitle="Redefinição de senha">
        <p className="text-tm-md leading-[1.5] text-tm-fg-muted">
          Esse link de redefinição de senha está incompleto ou não contém um token válido. Solicite um novo link na
          tela de recuperação de senha.
        </p>
        <Link to="/esqueci-senha" className="mt-4 inline-block text-tm-sm font-semibold text-tm-primary no-underline">
          Solicitar novo link
        </Link>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title="Senha redefinida" subtitle="Sua conta está pronta">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-tm-accent-green-bg text-tm-accent-green-fg">
            <IconCheck size={24} />
          </div>
          <p className="text-tm-md leading-[1.5] text-tm-fg-muted">
            Sua senha foi redefinida com sucesso. Você já pode entrar com sua nova senha.
          </p>
          <Button size="lg" full onClick={() => (window.location.href = '/login')}>
            Ir para o login
          </Button>
        </div>
      </AuthShell>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`)
      return
    }
    if (password !== confirmPassword) {
      setError('Senhas não conferem')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível redefinir a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Redefina sua senha" subtitle="Defina uma nova senha de acesso">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Nova senha"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={<IconLock size={18} />}
          autoComplete="new-password"
          required
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
        <Input
          label="Confirmar senha"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          icon={<IconLock size={18} />}
          autoComplete="new-password"
          required
          error={error || undefined}
        />
        <Button type="submit" size="lg" full disabled={loading}>
          {loading ? 'Salvando...' : 'Redefinir senha'}
        </Button>
      </form>
    </AuthShell>
  )
}
