import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

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
  const [focus, setFocus] = useState(false)
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tm-fg)' }}>{label}</span>}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--tm-surface)',
          border: '1.5px solid ' + (error ? 'var(--tm-error-border)' : focus ? 'var(--tm-primary)' : 'var(--tm-border)'),
          borderRadius: 'var(--tm-radius-input)',
          padding: '0 14px',
          height: 44,
          transition: 'all .18s ease',
          boxShadow: focus ? '0 0 0 4px var(--tm-focus-ring)' : 'none',
        }}
      >
        {icon && <span style={{ color: 'var(--tm-fg-subtle)', display: 'inline-flex' }}>{icon}</span>}
        <input
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          {...rest}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            fontSize: 14,
            color: 'var(--tm-fg)',
            minWidth: 0,
          }}
        />
        {iconRight}
      </div>
      {hint && !error && <span style={{ fontSize: 12, color: 'var(--tm-fg-subtle)' }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: 'var(--tm-error-text)' }}>{error}</span>}
    </label>
  )
}
