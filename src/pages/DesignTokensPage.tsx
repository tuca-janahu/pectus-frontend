import { useEffect, useState } from 'react'
import { Button, StatusBadge, type FichaStatus } from '../components/ui'

type Theme = 'light' | 'dark'
type Radius = 'sharp' | 'default' | 'soft'

const COLOR_SWATCHES: { label: string; varName: string }[] = [
  { label: 'Primary', varName: '--tm-primary' },
  { label: 'Primary deep', varName: '--tm-primary-deep' },
  { label: 'Background', varName: '--tm-bg' },
  { label: 'Surface', varName: '--tm-surface' },
  { label: 'Surface 2', varName: '--tm-surface-2' },
  { label: 'Foreground', varName: '--tm-fg' },
  { label: 'Foreground muted', varName: '--tm-fg-muted' },
  { label: 'Foreground subtle', varName: '--tm-fg-subtle' },
  { label: 'Border', varName: '--tm-border' },
]

const TYPE_SCALE: { token: string; size: string; weight: string }[] = [
  { token: '--tm-text-6xl', size: '28px', weight: 'bold' },
  { token: '--tm-text-5xl', size: '24px', weight: 'bold' },
  { token: '--tm-text-4xl', size: '22px', weight: 'bold' },
  { token: '--tm-text-3xl', size: '20px', weight: 'semibold' },
  { token: '--tm-text-2xl', size: '18px', weight: 'bold' },
  { token: '--tm-text-xl', size: '16px', weight: 'semibold' },
  { token: '--tm-text-lg', size: '15px', weight: 'bold' },
  { token: '--tm-text-md', size: '14px', weight: 'semibold' },
  { token: '--tm-text-base', size: '13px', weight: 'medium' },
  { token: '--tm-text-sm', size: '12px', weight: 'medium' },
  { token: '--tm-text-xs', size: '11px', weight: 'medium' },
  { token: '--tm-text-2xs', size: '10px', weight: 'semibold' },
]

const STATUSES: FichaStatus[] = ['agendada', 'concluida', 'cancelada', 'pendente']

const RADII: { key: Radius; label: string }[] = [
  { key: 'sharp', label: 'Marcado' },
  { key: 'default', label: 'Médio' },
  { key: 'soft', label: 'Suave' },
]

export function DesignTokensPage() {
  const [theme, setTheme] = useState<Theme>('light')
  const [radius, setRadius] = useState<Radius>('default')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-radius', radius)
  }, [radius])

  const toggleClass = (active: boolean) =>
    `rounded-[7px] border-none bg-transparent px-3.5 py-1.5 font-[inherit] text-tm-base font-semibold cursor-pointer transition-colors duration-150 ${
      active ? 'bg-tm-primary text-white' : 'text-tm-fg-muted'
    }`

  return (
    <div className="flex flex-col gap-8 text-tm-fg">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-tm-4xl font-bold tracking-[-0.02em]">Pectus — Design tokens</div>
          <div className="mt-1 text-tm-md text-tm-fg-muted">
            Cor, tipografia e raio portados do protótipo para o design system do front. Página temporária até a tela
            Início real ser implementada.
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 rounded-tm-sm border border-tm-border bg-tm-surface-2 p-1">
            {(['light', 'dark'] as Theme[]).map((t) => (
              <button key={t} className={toggleClass(theme === t)} onClick={() => setTheme(t)}>
                {t === 'light' ? 'Claro' : 'Escuro'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-tm-sm border border-tm-border bg-tm-surface-2 p-1">
            {RADII.map((r) => (
              <button key={r.key} className={toggleClass(radius === r.key)} onClick={() => setRadius(r.key)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-3.5">
        <div className="text-tm-2xl font-bold tracking-[-0.01em]">Cor</div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
          {COLOR_SWATCHES.map((c) => (
            <div key={c.varName} className="overflow-hidden rounded-tm-sm border border-tm-border">
              <div className="h-14 border-b border-tm-border" style={{ background: `var(${c.varName})` }} />
              <div className="bg-tm-surface px-2.5 py-2 text-tm-sm font-medium">
                {c.label}
                <span className="block font-mono text-tm-2xs text-tm-fg-subtle [overflow-wrap:anywhere]">
                  {c.varName}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-tm-card border border-tm-border bg-tm-surface p-5 shadow-tm-card">
          <div className="flex flex-wrap gap-2.5">
            {STATUSES.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3.5">
        <div className="text-tm-2xl font-bold tracking-[-0.01em]">Tipografia</div>
        <div className="rounded-tm-card border border-tm-border bg-tm-surface p-5 shadow-tm-card">
          {TYPE_SCALE.map((t) => (
            <div
              key={t.token}
              className="flex items-baseline gap-4 border-b border-tm-border py-2.5 last:border-b-0"
            >
              <span className="w-[190px] shrink-0 font-mono text-tm-2xs text-tm-fg-subtle">
                {t.token} · {t.size} / {t.weight}
              </span>
              <span
                className="font-tm-display text-tm-fg"
                style={{
                  fontSize: `var(${t.token})`,
                  fontWeight: t.weight === 'bold' ? 700 : t.weight === 'semibold' ? 600 : 500,
                }}
              >
                Fichas epicríticas
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3.5">
        <div className="text-tm-2xl font-bold tracking-[-0.01em]">Raio</div>
        <div className="flex flex-wrap gap-4">
          <div className="flex h-24 w-24 items-center justify-center border-[1.5px] border-tm-border bg-tm-surface-2 font-mono text-tm-2xs text-tm-fg-subtle rounded-tm-sm">
            sm
          </div>
          <div className="flex h-24 w-24 items-center justify-center border-[1.5px] border-tm-border bg-tm-surface-2 font-mono text-tm-2xs text-tm-fg-subtle rounded-tm-input">
            input
          </div>
          <div className="flex h-24 w-24 items-center justify-center border-[1.5px] border-tm-border bg-tm-surface-2 font-mono text-tm-2xs text-tm-fg-subtle rounded-tm-button">
            button
          </div>
          <div className="flex h-24 w-24 items-center justify-center border-[1.5px] border-tm-border bg-tm-surface-2 font-mono text-tm-2xs text-tm-fg-subtle rounded-tm-card">
            card
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>
    </div>
  )
}
