import { useState, useRef, useEffect, useCallback, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconChevronDown } from '../icons'

export interface DropdownOption {
  value: string | number
  label: string
}

export interface DropdownProps {
  label?: string
  options: DropdownOption[]
  value?: string | number
  onChange?: (value: string | number) => void
  icon?: ReactNode
  error?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
}

export function Dropdown({
  label,
  options,
  value,
  onChange,
  icon,
  error,
  className = '',
  id,
  required,
  placeholder = 'Selecione...',
  disabled = false
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [position, setPosition] = useState<{ left: number; top?: number; bottom?: number; width: number; maxHeight: number } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const generatedId = useId()
  const selectId = id || generatedId

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const abaixo = window.innerHeight - rect.bottom - 8
    const acima = rect.top - 8
    const abrirAcima = abaixo < 280 && acima > abaixo
    setPosition({
      left: rect.left,
      width: rect.width,
      ...(abrirAcima ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
      maxHeight: Math.max(100, Math.min(296, abrirAcima ? acima - 4 : abaixo - 4)),
    })
  }, [])

  // Fechar o dropdown se clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, updatePosition])

  // Filtrar opções com base na pesquisa
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedOption = options.find(o => o.value === value)

  const handleSelect = (val: string | number) => {
    if (onChange) onChange(val)
    setIsOpen(false)
    setSearch('') // Limpar a busca ao fechar
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label htmlFor={selectId} className="flex items-center gap-1 text-tm-base font-semibold text-tm-fg">
          {label}
          {required && <span className="text-tm-danger-fg">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Botão que simula o Select Nativo */}
        <button
          ref={buttonRef}
          type="button"
          id={selectId}
          disabled={disabled}
          onClick={() => {
            if (!isOpen) updatePosition()
            setIsOpen(!isOpen)
          }}
          className={`
            relative flex w-full items-center justify-between rounded-tm-input border bg-tm-surface-2 py-2.5 pr-4 text-left text-tm-md font-tm-body transition-colors
            focus:border-tm-primary focus:outline-none focus:ring-1 focus:ring-tm-primary
            disabled:cursor-not-allowed disabled:opacity-60
            ${icon ? 'pl-10' : 'pl-4'}
            ${error ? 'border-tm-error-border' : 'border-tm-border hover:border-tm-fg-subtle'}
            ${!selectedOption ? 'text-tm-fg-muted' : 'text-tm-fg'}
          `}
        >
          {icon && (
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-tm-fg-muted">
              {icon}
            </div>
          )}
          
          <span className="block truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          
          <div className="pointer-events-none ml-2 text-tm-fg-muted">
            <IconChevronDown size={18} />
          </div>
        </button>

        {/* Menu Suspenso com Filtro */}
        {isOpen && !disabled && position && createPortal(
          <div ref={menuRef} style={position} className="fixed z-[100] overflow-hidden rounded-tm-card border border-tm-border bg-tm-surface shadow-lg animate-in fade-in slide-in-from-top-2">
            
            {/* Campo de Busca */}
            <div className="sticky top-0 z-10 border-b border-tm-border bg-tm-surface p-2">
              <input
                type="text"
                className="w-full rounded-tm-sm border border-tm-border bg-tm-surface-2 px-3 py-1.5 text-tm-sm text-tm-fg transition-colors focus:border-tm-primary focus:outline-none"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()} // Impede o clique de fechar o menu
                autoFocus
              />
            </div>
            
            {/* Lista de Opções Limitada com Scroll */}
            <ul className="overflow-y-auto py-1" style={{ maxHeight: Math.max(48, position.maxHeight - 54) }}>
              {filteredOptions.length === 0 ? (
                <li className="px-4 py-3 text-center text-tm-sm text-tm-fg-muted">
                  Nenhum resultado encontrado.
                </li>
              ) : (
                filteredOptions.map((opt) => (
                  <li
                    key={opt.value}
                    className={`cursor-pointer px-4 py-2.5 text-tm-sm transition-colors hover:bg-tm-surface-2 ${
                      value === opt.value ? 'bg-[color-mix(in_oklch,var(--tm-primary)_10%,transparent)] font-semibold text-tm-primary' : 'text-tm-fg'
                    }`}
                    onClick={() => handleSelect(opt.value)}
                  >
                    {opt.label}
                  </li>
                ))
              )}
            </ul>
          </div>, document.body
        )}
      </div>
      
      {error && <span className="mt-0.5 text-tm-sm text-tm-error-text">{error}</span>}
    </div>
  )
}
