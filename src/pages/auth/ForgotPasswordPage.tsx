import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Input } from '../../components/ui'
import { IconArrowLeft, IconMail } from '../../components/icons'
import { AuthShell } from './AuthShell'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')

  return (
    <AuthShell title="Esqueci minha senha" subtitle="Recuperação de acesso por e-mail">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-4"
      >
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          icon={<IconMail size={18} />}
          autoComplete="email"
        />
        <Button type="submit" size="lg" full disabled aria-disabled="true" title="Em breve">
          Enviar link de recuperação
        </Button>
        <div className="rounded-tm-input border border-tm-border bg-tm-surface-2 p-3.5 text-tm-sm leading-[1.5] text-tm-fg-muted">
          <span className="mr-1.5 rounded-full bg-tm-surface px-2 py-0.5 text-[11px] font-semibold text-tm-fg-subtle">
            em breve
          </span>
          A recuperação de senha por e-mail ainda depende de uma rota no backend que ainda não existe. Por enquanto,
          fale com o administrador da clínica para redefinir seu acesso.
        </div>
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
