import type { ReactNode } from 'react'
import { IconStethoscope } from '../../components/icons'

export function AuthShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[linear-gradient(160deg,var(--tm-primary)_0%,var(--tm-primary-deep)_60%,color-mix(in_oklch,var(--tm-primary-deep)_60%,black)_100%)] grid grid-cols-1 min-[900px]:grid-cols-[1.1fr_1fr]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[200px] -left-[100px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgb(255_255_255_/_0.12),transparent_60%)] blur-[80px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[250px] -right-[150px] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--tm-primary)_60%,white)_0%,transparent_60%)] opacity-40 blur-[100px]"
      />

      <div className="relative z-[1] hidden min-[900px]:flex flex-col justify-between p-14 text-white">
        <div className="flex items-center gap-3.5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] border border-[rgb(255_255_255_/_0.2)] bg-[rgb(255_255_255_/_0.14)] backdrop-blur-[10px]">
            <IconStethoscope size={26} />
          </div>
          <div>
            <div className="text-[20px] font-bold tracking-[-0.01em]">Pectus</div>
            <div className="text-[12px] opacity-80">Acompanhamento de traqueoplastias</div>
          </div>
        </div>
        <div className="max-w-[480px]">
          <div className="mb-4 text-[clamp(32px,4vw,44px)] font-bold leading-[1.05] tracking-[-0.03em]">
            Fichas epicríticas, organizadas como você pensa.
          </div>
          <div className="text-[15px] leading-[1.55] opacity-85">
            Calendário cirúrgico, prontuário compacto e busca rápida — em uma só tela. Pensado para a rotina do
            consultório.
          </div>
        </div>
        <div className="flex gap-8 opacity-85">
          <div>
            <div className="text-[26px] font-bold tracking-[-0.02em]">2.4k+</div>
            <div className="text-[12px] opacity-80">Fichas epicríticas</div>
          </div>
          <div>
            <div className="text-[26px] font-bold tracking-[-0.02em]">180</div>
            <div className="text-[12px] opacity-80">Pacientes ativos</div>
          </div>
          <div>
            <div className="text-[26px] font-bold tracking-[-0.02em]">99.8%</div>
            <div className="text-[12px] opacity-80">Disponibilidade</div>
          </div>
        </div>
      </div>

      <div className="relative z-[1] flex min-h-dvh items-center justify-center px-5 py-8">
        <div className="w-full max-w-[420px] rounded-3xl border border-[color-mix(in_oklch,white_90%,transparent)] bg-tm-surface p-[clamp(28px,5vw,44px)] shadow-[0_30px_80px_rgb(0_0_0_/_0.2),0_8px_20px_rgb(0_0_0_/_0.08)]">
          <div className="mb-7">
            <div className="mb-[18px] inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
              <IconStethoscope size={24} />
            </div>
            <div className="text-[26px] font-bold tracking-[-0.02em] text-tm-fg">{title}</div>
            <div className="mt-1.5 text-tm-md text-tm-fg-muted">{subtitle}</div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
