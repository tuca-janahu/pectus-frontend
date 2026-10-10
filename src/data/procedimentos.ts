// Portado de data.jsx (TM_PROCEDURES) do protótipo Traque Med.
export const PROCEDIMENTOS = [
  'Exame de rotina',
  'Traqueoscopia',
  'Traqueoscopia + fístula',
  'Retirada de tubo T',
  'Broncoscopia',
  'Pré-operatório',
  'Avaliação para decanulação',
  'Endoscopia de controle',
  'Curativo + avaliação',
  'Outro',
]

export const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'agendada', label: 'Agendada' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'pendente', label: 'Em preenchimento' },
]
