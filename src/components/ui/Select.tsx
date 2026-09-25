import type { ReactNode, SelectHTMLAttributes } from 'react'
import { IconChevronDown } from '../icons'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  icon?: ReactNode
  error?: string
}

export function Select({ label, value, onChange, options, placeholder, icon, error, disabled, ...rest }: SelectProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-tm-base font-semibold text-tm-fg">{label}</span>}
      <div
        className={`flex h-11 items-center gap-2.5 rounded-tm-input border-[1.5px] bg-tm-surface px-3.5 transition-all duration-[180ms] ease-in-out focus-within:shadow-[0_0_0_4px_var(--tm-focus-ring)] ${
          error ? 'border-tm-error-border' : 'border-tm-border focus-within:border-tm-primary'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        {icon && <span className="inline-flex text-tm-fg-subtle">{icon}</span>}
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
          className="appearance-none min-w-0 flex-1 border-none bg-transparent font-[inherit] text-tm-md text-tm-fg outline-none"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="inline-flex shrink-0 text-tm-fg-subtle">
          <IconChevronDown size={16} />
        </span>
      </div>
      {error && <span className="text-tm-sm text-tm-error-text">{error}</span>}
    </label>
  )
}
