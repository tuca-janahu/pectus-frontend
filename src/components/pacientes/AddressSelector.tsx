import { useEffect, useState } from 'react'
import { Dropdown } from '../ui'
import type { DropdownOption } from '../ui'
import { IconMapPin } from '../icons'
import { useAuth } from '../../auth/AuthContext'

export interface LocalidadeEstado {
  codigo: number
  sigla: string
  nome: string
}

export interface LocalidadeMunicipio {
  codigo: number
  nome: string
}

export interface AddressSelectorValue {
  estadoId: number | ''
  estadoSigla: string
  municipioId: number | ''
  municipioNome: string
}

interface AddressSelectorProps {
  value: AddressSelectorValue
  onChange: (val: AddressSelectorValue) => void
  disabled?: boolean
}

export function AddressSelector({ value, onChange, disabled }: AddressSelectorProps) {
  const { accessToken } = useAuth()
  
  const [estados, setEstados] = useState<LocalidadeEstado[]>([])
  const [municipios, setMunicipios] = useState<LocalidadeMunicipio[]>([])
  const [loadingEstados, setLoadingEstados] = useState(false)
  const [loadingMunicipios, setLoadingMunicipios] = useState(false)
  const [erro, setErro] = useState('')

  // 1. Carregar lista de Estados
  useEffect(() => {
    if (!accessToken) return

    let active = true

    async function fetchEstados() {
      setLoadingEstados(true)
      setErro('')
      try {
        const res = await fetch('http://localhost:3000/localidades/estados', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!res.ok) throw new Error('Falha ao obter lista de estados.')
        
        const json = await res.json()
        const data: LocalidadeEstado[] = json.estados || json

        if (active && Array.isArray(data)) {
          setEstados(data.sort((a, b) => a.nome.localeCompare(b.nome)))
        }
      } catch (err) {
        if (active) setErro('Não foi possível carregar os estados.')
      } finally {
        if (active) setLoadingEstados(false)
      }
    }

    fetchEstados()

    return () => {
      active = false
    }
  }, [accessToken])

  // 2. Carregar Municípios em cascata
  useEffect(() => {
    if (!value.estadoId || !accessToken) {
      setMunicipios([])
      return
    }

    let active = true

    async function fetchMunicipios() {
      setLoadingMunicipios(true)
      setErro('')
      try {
        const res = await fetch(`http://localhost:3000/localidades/estados/${value.estadoId}/municipios`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!res.ok) throw new Error('Falha ao obter municípios.')
        
        const json = await res.json()
        const data: LocalidadeMunicipio[] = json.municipios || json

        if (active && Array.isArray(data)) {
          setMunicipios(data.sort((a, b) => a.nome.localeCompare(b.nome)))
        }
      } catch (err) {
        if (active) setErro('Não foi possível carregar os municípios deste estado.')
      } finally {
        if (active) setLoadingMunicipios(false)
      }
    }

    fetchMunicipios()

    return () => {
      active = false
    }
  }, [value.estadoId, accessToken])

  // Handlers para usar o 'codigo'
  const handleEstadoChange = (val: string | number) => {
    const selectedCodigo = Number(val)
    const selectedEstado = estados.find((uf) => uf.codigo === selectedCodigo)

    onChange({
      estadoId: selectedCodigo || '',
      estadoSigla: selectedEstado?.sigla ?? '',
      municipioId: '',
      municipioNome: '',
    })
  }

  const handleMunicipioChange = (val: string | number) => {
    const selectedCodigo = Number(val)
    const selectedMun = municipios.find((m) => (m.codigo || (m as any).id) === selectedCodigo)

    onChange({
      ...value,
      municipioId: selectedCodigo || '',
      municipioNome: selectedMun?.nome ?? '',
    })
  }

  const estadoOptions: DropdownOption[] = estados.map((uf) => ({
    value: uf.codigo,
    label: `${uf.nome} (${uf.sigla})`,
  }))

  const municipioOptions: DropdownOption[] = municipios.map((m) => ({
    value: m.codigo || (m as any).id,
    label: m.nome,
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Dropdown
          label="Estado (UF)"
          options={estadoOptions}
          value={value.estadoId}
          onChange={handleEstadoChange}
          placeholder={loadingEstados ? 'Carregando estados...' : 'Selecione o estado...'}
          disabled={disabled || loadingEstados || estados.length === 0}
          icon={<IconMapPin size={18} />}
          required
        />

        <Dropdown
          label="Município / Cidade"
          options={municipioOptions}
          value={value.municipioId}
          onChange={handleMunicipioChange}
          placeholder={
            !value.estadoId
              ? 'Selecione um estado antes...'
              : loadingMunicipios
              ? 'Carregando municípios...'
              : 'Selecione a cidade...'
          }
          disabled={disabled || !value.estadoId || loadingMunicipios}
          required
        />
      </div>

      {erro && <span className="text-tm-sm text-tm-error-text">{erro}</span>}
    </div>
  )
}