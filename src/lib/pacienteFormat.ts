// Formatação de paciente compartilhada entre telas (lista, detalhe, formulário)
// para evitar que cada tela calcule iniciais/idade com regras levemente
// diferentes.
export function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return '?'
}

// Usa getters UTC (não locais) porque dataNascimento é uma data "sem fuso"
// (ex.: "2000-05-15T00:00:00.000Z") — em fusos atrás de UTC, os getters
// locais podiam "voltar" a data um dia e calcular a idade errada.
export function calcularIdadeAnos(dataNascimento: string): number {
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getUTCFullYear() - nascimento.getUTCFullYear()
  const m = hoje.getUTCMonth() - nascimento.getUTCMonth()
  if (m < 0 || (m === 0 && hoje.getUTCDate() < nascimento.getUTCDate())) idade--
  return idade
}
