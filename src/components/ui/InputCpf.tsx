import { useState, type ComponentProps } from 'react'
import { Input } from './Input' 

const validarCPF = (cpf: string) => {
  const strCPF = cpf.replace(/\D/g, '')
  if (strCPF.length !== 11 || !!strCPF.match(/(\d)\1{10}/)) return false
  
  let soma = 0
  let resto
  
  for (let i = 1; i <= 9; i++) soma += parseInt(strCPF.substring(i - 1, i)) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(strCPF.substring(9, 10))) return false
  
  soma = 0
  for (let i = 1; i <= 10; i++) soma += parseInt(strCPF.substring(i - 1, i)) * (12 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(strCPF.substring(10, 11))) return false
  
  return true
}

const mascaraCPF = (valor: string) => {
  return valor
    .replace(/\D/g, '') 
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1') 
}

export function InputCpf({ value, onChange, onBlur, ...props }: ComponentProps<typeof Input>) {
  const [erroLocal, setErroLocal] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = mascaraCPF(e.target.value)
    if (onChange) onChange(e)

    if (e.target.value.length === 14) {
      setErroLocal(validarCPF(e.target.value) ? '' : 'CPF inválido')
    } else {
      setErroLocal('') 
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value && e.target.value.length < 14) {
      setErroLocal('CPF incompleto')
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
      maxLength={14}
    />
  )
}