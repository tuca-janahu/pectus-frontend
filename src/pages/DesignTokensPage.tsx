import { useEffect, useState } from 'react'
import { Button, StatusBadge, type FichaStatus } from '../components/ui'
import './DesignTokensPage.css'

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

  return (
    <div className="styleguide">
      <header className="styleguide-header">
        <div>
          <div className="styleguide-title">Traque Med — Design tokens</div>
          <div className="styleguide-subtitle">
            Cor, tipografia e raio portados do protótipo para o design system do front. Página temporária até a tela
            Início real ser implementada.
          </div>
        </div>
        <div className="styleguide-controls">
          <div className="sg-toggle-group">
            {(['light', 'dark'] as Theme[]).map((t) => (
              <button key={t} className="sg-toggle" data-active={theme === t} onClick={() => setTheme(t)}>
                {t === 'light' ? 'Claro' : 'Escuro'}
              </button>
            ))}
          </div>
          <div className="sg-toggle-group">
            {RADII.map((r) => (
              <button key={r.key} className="sg-toggle" data-active={radius === r.key} onClick={() => setRadius(r.key)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="sg-section">
        <div className="sg-section-title">Cor</div>
        <div className="sg-swatch-grid">
          {COLOR_SWATCHES.map((c) => (
            <div key={c.varName} className="sg-swatch">
              <div
                className="sg-swatch-fill"
                style={{ background: `var(${c.varName})`, borderBottom: '1px solid var(--tm-border)' }}
              />
              <div className="sg-swatch-label">
                {c.label}
                <span className="sg-swatch-value">{c.varName}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sg-card">
          <div className="sg-badge-row">
            {STATUSES.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </div>
      </section>

      <section className="sg-section">
        <div className="sg-section-title">Tipografia</div>
        <div className="sg-card">
          {TYPE_SCALE.map((t) => (
            <div key={t.token} className="sg-type-row">
              <span className="sg-type-meta">
                {t.token} · {t.size} / {t.weight}
              </span>
              <span
                className="sg-type-sample"
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

      <section className="sg-section">
        <div className="sg-section-title">Raio</div>
        <div className="sg-radius-row">
          <div className="sg-radius-box" style={{ borderRadius: 'var(--tm-radius-sm)' }}>
            sm
          </div>
          <div className="sg-radius-box" style={{ borderRadius: 'var(--tm-radius-input)' }}>
            input
          </div>
          <div className="sg-radius-box" style={{ borderRadius: 'var(--tm-radius-button)' }}>
            button
          </div>
          <div className="sg-radius-box" style={{ borderRadius: 'var(--tm-radius-card)' }}>
            card
          </div>
        </div>

        <div className="sg-button-row">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>
    </div>
  )
}
