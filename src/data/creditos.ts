export interface Criador {
  nome: string
  curso: string
  foto?: string
}

// Dados de placeholder — substituir pelos dados reais dos 5 criadores do sistema.
// `foto` é opcional: se informado (URL/caminho da imagem), o Avatar usa a foto real
// em vez das iniciais do nome.
export const CRIADORES: Criador[] = [
  { nome: 'Lucas Mineiro Pereira Braga', curso: 'Engenharia de Computação' },
  { nome: 'Nome do Criador 2', curso: 'Curso técnico' },
  { nome: 'Nome do Criador 3', curso: 'Curso técnico' },
  { nome: 'Nome do Criador 4', curso: 'Curso técnico' },
  { nome: 'Nome do Criador 5', curso: 'Curso técnico' },
]
