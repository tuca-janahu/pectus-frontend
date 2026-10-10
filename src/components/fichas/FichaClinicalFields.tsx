import { Input, Select } from '../ui'
import type { FichaClinicalValues } from '../../lib/fichasStore'

interface FichaClinicalFieldsProps {
  value: FichaClinicalValues
  onChange: (value: FichaClinicalValues) => void
  disabled?: boolean
}

const BOOLEAN_OPTIONS = [
  { value: 'false', label: 'Não' },
  { value: 'true', label: 'Sim' },
]

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  rows?: number
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-tm-base font-semibold text-tm-fg">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="min-h-[88px] resize-y rounded-tm-input border-[1.5px] border-tm-border bg-tm-surface px-3.5 py-3 font-[inherit] text-tm-md text-tm-fg outline-none transition-all focus:border-tm-primary focus:shadow-[0_0_0_4px_var(--tm-focus-ring)] disabled:opacity-50"
      />
    </label>
  )
}

function BooleanChoice({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex shrink-0 rounded-tm-button border border-tm-border bg-tm-surface-2 p-1"
    >
      {[
        { label: 'Não', value: false },
        { label: 'Sim', value: true },
      ].map((option) => (
        <button
          key={String(option.value)}
          type="button"
          aria-pressed={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`min-w-[64px] rounded-tm-sm px-3 py-1.5 text-tm-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            value === option.value
              ? 'bg-tm-primary text-white shadow-tm-card'
              : 'text-tm-fg-muted hover:bg-tm-surface hover:text-tm-fg'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function HistoryQuestion({
  title,
  helper,
  value,
  onChange,
  detailLabel,
  detailValue,
  onDetailChange,
  placeholder,
  disabled,
}: {
  title: string
  helper: string
  value: boolean
  onChange: (value: boolean) => void
  detailLabel: string
  detailValue: string
  onDetailChange: (value: string) => void
  placeholder: string
  disabled?: boolean
}) {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h4 className="text-tm-base font-bold text-tm-fg">{title}</h4>
          <p className="mt-0.5 text-tm-sm leading-relaxed text-tm-fg-muted">{helper}</p>
        </div>
        <BooleanChoice label={title} value={value} onChange={onChange} disabled={disabled} />
      </div>

      {value && (
        <div className="mt-4 border-t border-tm-border pt-4">
          <TextareaField
            label={detailLabel}
            value={detailValue}
            onChange={onDetailChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
          />
        </div>
      )}
    </div>
  )
}

export function FichaClinicalFields({ value, onChange, disabled }: FichaClinicalFieldsProps) {
  const set = <K extends keyof FichaClinicalValues>(field: K, fieldValue: FichaClinicalValues[K]) => {
    onChange({ ...value, [field]: fieldValue })
  }
  const booleanSelect = (
    field: 'vocaliza' | 'traqueostomizado' | 'possuiComorbidades' | 'possuiSequelas' | 'usaMedicamentos' | 'possuiLaringoscopia',
    nextValue: string,
  ) => {
    const enabled = nextValue === 'true'
    const next = { ...value, [field]: enabled }
    if (!enabled && field === 'possuiComorbidades') next.comorbidadesDescricao = ''
    if (!enabled && field === 'possuiSequelas') next.sequelasDescricao = ''
    if (!enabled && field === 'usaMedicamentos') next.medicamentosDescricao = ''
    if (!enabled && field === 'possuiLaringoscopia') next.achadoLaringoscopia = ''
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-tm-input border border-tm-border bg-tm-surface-2 p-4">
        <div>
          <h3 className="text-tm-lg font-bold text-tm-fg">Injúria traqueal</h3>
          <p className="text-tm-sm text-tm-fg-muted">Informações clínicas de origem e condição atual.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Mecanismo da lesão"
            value={value.mecanismoLesao}
            onChange={(event) => set('mecanismoLesao', event.target.value)}
            placeholder="Ex.: trauma, intubação prolongada"
            disabled={disabled}
          />
          <Input
            label="Data da injúria traqueal"
            type="date"
            value={value.dataInjuriaTraqueal}
            onChange={(event) => set('dataInjuriaTraqueal', event.target.value)}
            disabled={disabled}
          />
          <Select
            label="Vocaliza?"
            value={String(value.vocaliza)}
            onChange={(nextValue) => booleanSelect('vocaliza', nextValue)}
            options={BOOLEAN_OPTIONS}
            disabled={disabled}
          />
          <Select
            label="Está traqueostomizado?"
            value={String(value.traqueostomizado)}
            onChange={(nextValue) => booleanSelect('traqueostomizado', nextValue)}
            options={BOOLEAN_OPTIONS}
            disabled={disabled}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-tm-input border border-tm-border bg-tm-surface">
        <div className="border-b border-tm-border bg-tm-surface-2 px-4 py-4 sm:px-5">
          <h3 className="text-tm-lg font-bold text-tm-fg">Histórico clínico</h3>
          <p className="mt-0.5 text-tm-sm text-tm-fg-muted">
            Revise as informações recuperadas da última ficha concluída e atualize somente o que mudou.
          </p>
        </div>

        <div className="divide-y divide-tm-border">
          <HistoryQuestion
            title="Comorbidades"
            helper="O paciente possui alguma condição clínica associada?"
            value={value.possuiComorbidades}
            onChange={(nextValue) => booleanSelect('possuiComorbidades', String(nextValue))}
            detailLabel="Quais comorbidades?"
            detailValue={value.comorbidadesDescricao}
            onDetailChange={(nextValue) => set('comorbidadesDescricao', nextValue)}
            placeholder="Descreva as comorbidades relevantes"
            disabled={disabled}
          />

          <HistoryQuestion
            title="Sequelas"
            helper="Há alguma sequela relevante para o atendimento atual?"
            value={value.possuiSequelas}
            onChange={(nextValue) => booleanSelect('possuiSequelas', String(nextValue))}
            detailLabel="Quais sequelas?"
            detailValue={value.sequelasDescricao}
            onDetailChange={(nextValue) => set('sequelasDescricao', nextValue)}
            placeholder="Descreva as sequelas relevantes"
            disabled={disabled}
          />

          <HistoryQuestion
            title="Medicamentos em uso"
            helper="O paciente faz uso contínuo ou atual de medicamentos?"
            value={value.usaMedicamentos}
            onChange={(nextValue) => booleanSelect('usaMedicamentos', String(nextValue))}
            detailLabel="Quais medicamentos?"
            detailValue={value.medicamentosDescricao}
            onDetailChange={(nextValue) => set('medicamentosDescricao', nextValue)}
            placeholder="Informe nomes, doses e frequência, se souber"
            disabled={disabled}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-tm-input border border-tm-border bg-tm-surface-2 p-4">
        <div>
          <h3 className="text-tm-lg font-bold text-tm-fg">Laringoscopia</h3>
          <p className="text-tm-sm text-tm-fg-muted">Registre se o exame já foi realizado e o achado correspondente.</p>
        </div>
        <Select
          label="Já realizou laringoscopia?"
          value={String(value.possuiLaringoscopia)}
          onChange={(nextValue) => booleanSelect('possuiLaringoscopia', nextValue)}
          options={BOOLEAN_OPTIONS}
          disabled={disabled}
        />
        {value.possuiLaringoscopia && (
          <TextareaField
            label="Achado da laringoscopia"
            value={value.achadoLaringoscopia}
            onChange={(nextValue) => set('achadoLaringoscopia', nextValue)}
            placeholder="Descreva os achados do exame"
            disabled={disabled}
          />
        )}
      </section>

      <TextareaField
        label="Particularidades"
        value={value.particularidades}
        onChange={(nextValue) => set('particularidades', nextValue)}
        placeholder="Registre outras particularidades clínicas relevantes"
        disabled={disabled}
      />
    </div>
  )
}
