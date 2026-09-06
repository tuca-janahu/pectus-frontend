import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { IconArrowLeft, IconCheck, IconMail } from '../../components/icons'
import { forgotPassword, ApiError } from '../../lib/api'
import { AuthShell } from './AuthShell'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <AuthShell title="Verifique seu e-mail" subtitle="Recuperação de acesso">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-tm-accent-green-bg text-tm-accent-green-fg">
            <IconCheck size={24} />
          </div>
          <p className="text-tm-md leading-[1.5] text-tm-fg-muted">
            Se este e-mail estiver cadastrado, enviamos um link para redefinir sua senha. Confira também a caixa de
            spam.
          </p>
          <Link to="/login" className="text-tm-sm font-semibold text-tm-primary no-underline">
            Voltar para o login
          </Link>
        </div>
      </AuthShell>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível enviar o link. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Esqueci minha senha" subtitle="Recuperação de acesso por e-mail">
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
          error={error || undefined}
        />
        <Button type="submit" size="lg" full disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </Button>
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-1.5 text-tm-sm font-semibold text-tm-primary no-underline"
        >
          <IconArrowLeft size={14} />
          Voltar para o login
        </Link>
      </form>
    </AuthShell>
  )
}
