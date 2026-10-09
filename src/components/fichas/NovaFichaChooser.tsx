import type { ReactNode } from 'react'
import { IconArrowRight, IconCheck, IconClipboard, IconMessage } from '../icons'

interface ChooserOption {
  id: 'form' | 'ao-vivo'
  icon: ReactNode
  tag: string
  title: string
  body: string
  bullets: string[]
  accentClass: string
  cta: string
}

const OPTIONS: ChooserOption[] = [
  {
    id: 'form',
    icon: <IconClipboard size={26} />,
    tag: 'Preparada com antecedência',
    title: 'Ficha prévia',
    body: 'Preencha os dados do procedimento antes do atendimento — paciente, data, horário, conduta e observações.',
    bullets: ['Agendamento e organização', 'Formulário direto', 'Editável a qualquer momento'],
    accentClass: 'text-tm-primary',
    cta: 'Preencher formulário',
  },
  {
    id: 'ao-vivo',
    icon: <IconMessage size={26} />,
    tag: 'Durante a consulta',
    title: 'Atendimento ao vivo',
    body: 'Conduza a anamnese pergunta por pergunta com o paciente à sua frente, preenchendo a ficha em tempo real.',
    bullets: ['Roteiro guiado de perguntas', 'Uma pergunta por vez', 'Resumo automático ao final'],
    accentClass: 'text-tm-accent-green-fg',
    cta: 'Iniciar atendimento',
  },
]

interface NovaFichaChooserProps {
  onChoose: (id: 'form' | 'ao-vivo') => void
}

export function NovaFichaChooser({ onChoose }: NovaFichaChooserProps) {
  return (
    <div>
      <h2 className="text-tm-3xl font-bold tracking-[-0.01em] text-tm-fg">Nova ficha</h2>
      <p className="mt-1 text-tm-md text-tm-fg-muted">Como você quer registrar?</p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChoose(o.id)}
            className="flex flex-col gap-3.5 rounded-tm-card border border-tm-border bg-tm-surface p-6 text-left shadow-tm-card transition-all hover:-translate-y-0.5 hover:shadow-tm-card-hover hover:border-[color-mix(in_oklch,var(--tm-primary)_35%,var(--tm-border))]"
          >
            <div className={`inline-flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-[color-mix(in_oklch,currentColor_14%,transparent)] ${o.accentClass}`}>
              {o.icon}
            </div>
            <div>
              <div className={`mb-1 text-tm-xs font-bold uppercase tracking-wider ${o.accentClass}`}>{o.tag}</div>
              <div className="text-tm-2xl font-bold tracking-[-0.02em] text-tm-fg">{o.title}</div>
              <div className="mt-1.5 text-tm-md leading-[1.5] text-tm-fg-muted">{o.body}</div>
            </div>
            <div className="mt-0.5 flex flex-col gap-2">
              {o.bullets.map((b) => (
                <div key={b} className="flex items-center gap-2 text-tm-base text-tm-fg">
                  <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklch,currentColor_14%,transparent)] ${o.accentClass}`}>
                    <IconCheck size={12} />
                  </span>
                  {b}
                </div>
              ))}
            </div>
            <div className={`mt-1.5 inline-flex items-center gap-2 text-tm-md font-bold ${o.accentClass}`}>
              {o.cta} <IconArrowRight size={16} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
