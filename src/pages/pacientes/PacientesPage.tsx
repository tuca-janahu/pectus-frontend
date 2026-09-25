import { useState, useEffect } from 'react'
import { IconPlus, IconChevronRight } from '../../components/icons'
import { PatientCard } from '../../components/pacientes/PatientCard'
import { PatientForm } from '../../components/pacientes/PatientForm'
import { useAuth } from '../../auth/AuthContext'

export interface PacientesPageProps {
  searchTerm?: string
  onCountChange?: (count: number) => void
}

interface Paciente {
  id: number
  nome: string
  dataNascimento: string
  genero: string
}

export function PacientesPage({ searchTerm = '', onCountChange }: PacientesPageProps) {
  const { accessToken } = useAuth()
  const [showForm, setShowForm] = useState(false)
  
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState(true)

  const carregarPacientes = async () => {
    if (!accessToken) return
    
    setLoading(true)
    try {
      const url = searchTerm 
        ? `http://localhost:3000/pacientes?nome=${encodeURIComponent(searchTerm)}`
        : 'http://localhost:3000/pacientes'

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (res.ok) {
        const data = await res.json()
        const lista = data.pacientes || []
        setPacientes(lista)
        if (onCountChange) {
          onCountChange(lista.length)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarPacientes()
  }, [accessToken, searchTerm])

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const m = hoje.getMonth() - nascimento.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--
    }
    return idade
  }

  const obterIniciais = (nome: string) => {
    const partes = nome.trim().split(' ')
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
    }
    return nome.substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-tm-bg flex flex-col gap-6">
      {!showForm && (
        <button 
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-between rounded-tm-card bg-emerald-600 p-4 text-white shadow-sm transition hover:bg-emerald-700 animate-in fade-in"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-tm-sm bg-white/20 p-2">
              <IconPlus size={24} className="text-white" />
            </div>
            <div className="text-left font-tm-body">
              <span className="block text-tm-xl font-bold leading-tight">Adicionar novo paciente</span>
              <span className="mt-0.5 block text-tm-sm font-medium text-emerald-50">
                Cadastre dados, histórico e foto
              </span>
            </div>
          </div>
          <IconChevronRight size={24} className="text-white/70" />
        </button>
      )}

      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <PatientForm 
            onCancel={() => setShowForm(false)} 
            onSuccess={() => {
              setShowForm(false)
              carregarPacientes()
            }} 
          />
        </div>
      )}

      {loading ? (
        <div className="text-tm-sm text-tm-fg-muted py-4">Carregando pacientes...</div>
      ) : pacientes.length === 0 ? (
        <div className="text-tm-sm text-tm-fg-muted py-4">Nenhum paciente encontrado.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pacientes.map((paciente) => (
            <PatientCard
              key={paciente.id}
              nome={paciente.nome}
              idade={calcularIdade(paciente.dataNascimento)}
              fichas={0}
              iniciais={obterIniciais(paciente.nome)}
              corAvatarBg="bg-tm-avatar-sky-bg"
              corAvatarFg="text-tm-avatar-sky-fg"
            />
          ))}
        </div>
      )}
    </div>
  )
}