import { useState, type ComponentProps } from 'react'
import { Input } from './Input'

const mascaraTelefone = (valor: string) => {
  let v = valor.replace(/\D/g, '')
  if (v.length <= 10) {
    // Fixo: (XX) XXXX-XXXX
    return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  // Celular: (XX) XXXXX-XXXX
  return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4}).*/, '$1-$2')
}

export function InputPhone({ value, onChange, onBlur, ...props }: ComponentProps<typeof Input>) {
  const [erroLocal, setErroLocal] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = mascaraTelefone(e.target.value)
    if (onChange) onChange(e)

    const digitos = e.target.value.replace(/\D/g, '')
    if (digitos.length === 10 || digitos.length === 11) {
      setErroLocal('')
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const digitos = String(e.target.value || '').replace(/\D/g, '')
    if (digitos.length > 0 && digitos.length < 10) {
      setErroLocal('Telefone incompleto')
    }
    if (onBlur) onBlur(e)
  }

  return (
    <Input
      {...props}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      error={erroLocal || props.error}
      maxLength={15}
    />
  )
}