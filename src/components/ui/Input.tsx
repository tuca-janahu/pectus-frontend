import type { InputHTMLAttributes, ReactNode } from 'react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  value?: string
  onChange?: InputHTMLAttributes<HTMLInputElement>['onChange']
  icon?: ReactNode
  iconRight?: ReactNode
  error?: string
  hint?: string
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  iconRight,
  error,
  hint,
  ...rest
}: InputProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-tm-base font-semibold text-tm-fg">{label}</span>}
      <div
        className={`flex h-11 items-center gap-2.5 rounded-tm-input border-[1.5px] bg-tm-surface px-3.5 transition-all duration-[180ms] ease-in-out focus-within:shadow-[0_0_0_4px_var(--tm-focus-ring)] ${
          error ? 'border-tm-error-border' : 'border-tm-border focus-within:border-tm-primary'
        }`}
      >
        {icon && <span className="inline-flex text-tm-fg-subtle">{icon}</span>}
        <input
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          {...rest}
          className="min-w-0 flex-1 border-none bg-transparent font-[inherit] text-tm-md text-tm-fg outline-none"
        />
        {iconRight}
      </div>
      {hint && !error && <span className="text-tm-sm text-tm-fg-subtle">{hint}</span>}
      {error && <span className="text-tm-sm text-tm-error-text">{error}</span>}
    </label>
  )
}
