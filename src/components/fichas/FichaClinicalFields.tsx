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

      <section className="flex flex-col gap-4 rounded-tm-input border border-tm-border bg-tm-surface-2 p-4">
        <div>
          <h3 className="text-tm-lg font-bold text-tm-fg">Histórico clínico</h3>
          <p className="text-tm-sm text-tm-fg-muted">As respostas vêm preenchidas com os dados da última ficha concluída.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Possui comorbidades?"
            value={String(value.possuiComorbidades)}
            onChange={(nextValue) => booleanSelect('possuiComorbidades', nextValue)}
            options={BOOLEAN_OPTIONS}
            disabled={disabled}
          />
          {value.possuiComorbidades && (
            <TextareaField
              label="Quais comorbidades?"
              value={value.comorbidadesDescricao}
              onChange={(nextValue) => set('comorbidadesDescricao', nextValue)}
              placeholder="Descreva as comorbidades"
              disabled={disabled}
            />
          )}

          <Select
            label="Possui sequelas?"
            value={String(value.possuiSequelas)}
            onChange={(nextValue) => booleanSelect('possuiSequelas', nextValue)}
            options={BOOLEAN_OPTIONS}
            disabled={disabled}
          />
          {value.possuiSequelas && (
            <TextareaField
              label="Quais sequelas?"
              value={value.sequelasDescricao}
              onChange={(nextValue) => set('sequelasDescricao', nextValue)}
              placeholder="Descreva as sequelas"
              disabled={disabled}
            />
          )}

          <Select
            label="Usa medicamentos?"
            value={String(value.usaMedicamentos)}
            onChange={(nextValue) => booleanSelect('usaMedicamentos', nextValue)}
            options={BOOLEAN_OPTIONS}
            disabled={disabled}
          />
          {value.usaMedicamentos && (
            <TextareaField
              label="Quais medicamentos?"
              value={value.medicamentosDescricao}
              onChange={(nextValue) => set('medicamentosDescricao', nextValue)}
              placeholder="Informe nomes, doses e frequência"
              disabled={disabled}
            />
          )}
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
