import { useMemo, useState } from 'react'
import { Avatar, Button } from '../ui'
import type { AvatarColor } from '../ui'
import { IconArrowRight, IconCheck, IconChevronLeft, IconEdit, IconMessage, IconPlus, IconStethoscope } from '../icons'
import { PatientPicker } from './PatientPicker'
import { PROCEDIMENTOS } from '../../data/procedimentos'
import { createFicha, type Ficha } from '../../lib/fichasStore'
import type { PacienteResumo } from '../../lib/api'
import { toastError, toastSuccess } from '../../lib/toast'
import { useAuth } from '../../auth/AuthContext'

const AVATAR_COLORS: AvatarColor[] = ['sky', 'teal', 'violet', 'rose', 'amber']

function obterIniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return '?'
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--
  return idade
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

const SINTOMAS = ['Dispneia', 'Estridor', 'Tosse', 'Secreção aumentada', 'Disfonia (rouquidão)', 'Disfagia', 'Sangramento', 'Febre']
const ANTECEDENTES_OPCOES = ['Hipertensão', 'Diabetes', 'Asma / DPOC', 'Refluxo (DRGE)', 'Tabagismo', 'Cardiopatia', 'Nenhum']

type StepId = 'paciente' | 'queixa' | 'inicio' | 'via_aerea' | 'sintomas' | 'antecedentes' | 'cirurgias' | 'exame' | 'procedimento' | 'plano'
type StepType = 'patient' | 'textarea' | 'radio' | 'chips' | 'procedure'

interface Step {
  id: StepId
  type: StepType
  who: 'paciente' | 'medico'
  question: string
  helper?: string
  placeholder?: string
  options?: string[]
  optional?: boolean
}

const STEPS: Step[] = [
  { id: 'paciente', type: 'patient', who: 'paciente', question: 'Quem é o paciente?', helper: 'Confirme os dados de identificação antes de começar.' },
  { id: 'queixa', type: 'textarea', who: 'paciente', question: 'O que trouxe você ao consultório hoje?', helper: 'Registre a queixa principal nas palavras do paciente.', placeholder: 'Queixa principal…' },
  { id: 'inicio', type: 'radio', who: 'paciente', question: 'Há quanto tempo começaram os sintomas?', options: ['Menos de 1 mês', '1 a 6 meses', '6 a 12 meses', 'Mais de 1 ano'], optional: true },
  { id: 'via_aerea', type: 'radio', who: 'paciente', question: 'Você usa algum tipo de cânula ou tubo na traqueia atualmente?', options: ['Cânula metálica', 'Cânula plástica', 'Tubo T (Montgomery)', 'Traqueostomia sem cânula', 'Já decanulado', 'Não uso'], optional: true },
  { id: 'sintomas', type: 'chips', who: 'paciente', question: 'Tem sentido algum destes sintomas?', helper: 'Marque todos os que o paciente relatar.', options: SINTOMAS, optional: true },
  { id: 'antecedentes', type: 'chips', who: 'paciente', question: 'Tem alguma destas condições de saúde?', options: ANTECEDENTES_OPCOES, optional: true },
  { id: 'cirurgias', type: 'textarea', who: 'paciente', question: 'Já passou por cirurgias na via aérea ou traqueostomias anteriores?', helper: 'Datas, locais e tipos de procedimento, se souber.', placeholder: 'Histórico cirúrgico…', optional: true },
  { id: 'exame', type: 'textarea', who: 'medico', question: 'Exame físico e achados', helper: 'Inspeção da via aérea, ausculta, estado do estoma/cânula.', placeholder: 'Achados do exame…', optional: true },
  { id: 'procedimento', type: 'procedure', who: 'medico', question: 'Conduta / procedimento indicado', helper: 'Selecione o procedimento a registrar nesta ficha.' },
  { id: 'plano', type: 'textarea', who: 'medico', question: 'Plano e orientações ao paciente', helper: 'Próximos passos, retorno, medicações e cuidados.', placeholder: 'Plano terapêutico…', optional: true },
]

const LABELS: Partial<Record<StepId, string>> = {
  queixa: 'Queixa principal',
  inicio: 'Início dos sintomas',
  via_aerea: 'Via aérea atual',
  cirurgias: 'Cirurgias prévias',
  exame: 'Exame físico',
  plano: 'Plano e orientações',
}

interface FichaAoVivoProps {
  onCancel: () => void
  onSuccess: (ficha: Ficha) => void
}

export function FichaAoVivo({ onCancel, onSuccess }: FichaAoVivoProps) {
  const { accessToken, user } = useAuth()
  const [idx, setIdx] = useState(0)
  const [review, setReview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [pacienteId, setPacienteId] = useState<number | ''>('')
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [data] = useState(hojeISO())
  const [hora] = useState(() => new Date().toTimeString().slice(0, 5))
  const [queixa, setQueixa] = useState('')
  const [inicio, setInicio] = useState('')
  const [viaAerea, setViaAerea] = useState('')
  const [sintomas, setSintomas] = useState<string[]>([])
  const [antecedentes, setAntecedentes] = useState<string[]>([])
  const [cirurgias, setCirurgias] = useState('')
  const [exame, setExame] = useState('')
  const [procedimento, setProcedimento] = useState('')
  const [plano, setPlano] = useState('')

  const total = STEPS.length
  const step = STEPS[idx]
  const progress = review ? 100 : Math.round((idx / total) * 100)
  const paciente = useMemo(() => pacientes.find((p) => p.id === pacienteId), [pacientes, pacienteId])

  const getAnswer = (id: StepId): string | string[] => {
    switch (id) {
      case 'queixa': return queixa
      case 'inicio': return inicio
      case 'via_aerea': return viaAerea
      case 'sintomas': return sintomas
      case 'antecedentes': return antecedentes
      case 'cirurgias': return cirurgias
      case 'exame': return exame
      case 'procedimento': return procedimento
      case 'plano': return plano
      default: return ''
    }
  }
  const setAnswer = (id: StepId, value: string | string[]) => {
    setError('')
    switch (id) {
      case 'queixa': setQueixa(value as string); break
      case 'inicio': setInicio(value as string); break
      case 'via_aerea': setViaAerea(value as string); break
      case 'sintomas': setSintomas(value as string[]); break
      case 'antecedentes': setAntecedentes(value as string[]); break
      case 'cirurgias': setCirurgias(value as string); break
      case 'exame': setExame(value as string); break
      case 'procedimento': setProcedimento(value as string); break
      case 'plano': setPlano(value as string); break
    }
  }
  const toggleChip = (id: StepId, opt: string) => {
    const cur = getAnswer(id) as string[]
    setAnswer(id, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt])
  }

  const isEmpty = (v: string | string[]) => (Array.isArray(v) ? v.length === 0 : !v.trim())

  const next = () => {
    if (step.type === 'patient') {
      if (!pacienteId) {
        setError('Selecione um paciente para continuar.')
        return
      }
    } else if (!step.optional && isEmpty(getAnswer(step.id))) {
      setError('Este campo é obrigatório.')
      return
    }
    setError('')
    if (idx < total - 1) setIdx(idx + 1)
    else setReview(true)
  }

  const back = () => {
    setError('')
    if (review) { setReview(false); return }
    if (idx > 0) setIdx(idx - 1)
    else onCancel()
  }

  const compileDescription = () => {
    const lines: string[] = []
    for (const id of ['queixa', 'inicio', 'via_aerea', 'cirurgias', 'exame', 'plano'] as StepId[]) {
      const v = getAnswer(id)
      if (typeof v === 'string' && v.trim()) lines.push(`${LABELS[id]}: ${v}`)
    }
    if (sintomas.length) lines.push(`Sintomas relatados: ${sintomas.join(', ')}`)
    if (antecedentes.length) lines.push(`Antecedentes: ${antecedentes.join(', ')}`)
    return lines.join('\n')
  }

  const finish = async () => {
    if (!pacienteId) return
    if (!accessToken || !user?.medico?.id) {
      toastError('Seu usuário não possui um perfil médico ativo.')
      return
    }
    setLoading(true)
    try {
      const ficha = await createFicha(accessToken, user.medico.id, {
        pacienteId,
        data,
        hora,
        procedimento: procedimento || 'Atendimento clínico',
        status: 'concluida',
        descricao: compileDescription(),
        modo: 'ao-vivo',
      })
      toastSuccess('Ficha registrada com sucesso.')
      onSuccess(ficha)
    } catch {
      toastError('Não foi possível salvar a ficha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const avatarColor = paciente ? AVATAR_COLORS[paciente.id % AVATAR_COLORS.length] : 'sky'

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-1.5 rounded-full border border-tm-border bg-tm-surface-2 px-3 py-1.5 text-tm-sm font-medium text-tm-fg-muted"
        >
          <IconChevronLeft size={16} /> {review || idx > 0 ? 'Anterior' : 'Cancelar'}
        </button>
        {paciente && (
          <div className="inline-flex items-center gap-2 rounded-full border border-tm-border bg-tm-surface-2 py-1 pl-1.5 pr-3">
            <Avatar initials={obterIniciais(paciente.nome)} color={avatarColor} size={24} />
            <span className="text-tm-sm font-semibold text-tm-fg">{paciente.nome}</span>
          </div>
        )}
        <div className="flex-1" />
        <span className="text-tm-sm font-bold text-tm-fg-muted">
          {review ? 'Revisão' : `Etapa ${idx + 1} de ${total}`}
        </span>
      </div>

      <div className="mt-3 h-1 overflow-hidden rounded-full bg-tm-surface-2">
        <div
          className="h-full rounded-full bg-tm-primary transition-[width] duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 rounded-tm-card border border-tm-border bg-tm-surface p-[clamp(20px,4vw,32px)] shadow-tm-card">
        {review ? (
          <FichaAoVivoReview
            paciente={paciente}
            avatarColor={avatarColor}
            data={data}
            hora={hora}
            loading={loading}
            rows={STEPS.filter((s) => s.type !== 'patient').map((s) => {
              const v = getAnswer(s.id)
              const display = Array.isArray(v) ? (v.length ? v.join(', ') : null) : v.trim() ? v : null
              return { stepIdx: STEPS.indexOf(s), label: s.question, value: display }
            })}
            onEdit={(i) => { setReview(false); setIdx(i) }}
            onFinish={finish}
          />
        ) : (
          <div>
            <div
              className={`mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-tm-xs font-bold ${
                step.who === 'paciente'
                  ? 'border-[color-mix(in_oklch,var(--tm-primary)_24%,transparent)] bg-[color-mix(in_oklch,var(--tm-primary)_12%,transparent)] text-tm-primary-deep'
                  : 'border-tm-border bg-tm-surface-2 text-tm-fg-muted'
              }`}
            >
              {step.who === 'paciente' ? <IconMessage size={14} /> : <IconStethoscope size={14} />}
              {step.who === 'paciente' ? 'Pergunte ao paciente' : 'Avaliação clínica'}
            </div>

            <div className="text-tm-5xl font-bold leading-[1.2] tracking-[-0.02em] text-tm-fg">{step.question}</div>
            {step.helper && <div className="mt-2 text-tm-md leading-[1.5] text-tm-fg-muted">{step.helper}</div>}

            <div className="mt-5">
              {step.type === 'patient' && (
                <PatientPicker value={pacienteId} onChange={setPacienteId} onPatientsChange={setPacientes} disabled={loading} />
              )}

              {step.type === 'textarea' && (
                <textarea
                  autoFocus
                  value={getAnswer(step.id) as string}
                  onChange={(e) => setAnswer(step.id, e.target.value)}
                  placeholder={step.placeholder}
                  rows={5}
                  className="min-h-[120px] w-full resize-y rounded-tm-input border-[1.5px] border-tm-border bg-tm-surface px-4 py-3.5 font-[inherit] text-tm-lg leading-[1.5] text-tm-fg outline-none focus:border-tm-primary"
                />
              )}

              {step.type === 'radio' && (
                <div className="flex flex-col gap-2.5">
                  {step.options?.map((opt) => {
                    const sel = getAnswer(step.id) === opt
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAnswer(step.id, opt)}
                        className={`flex items-center gap-3 rounded-tm-input border-[1.5px] px-4 py-3.5 text-left text-tm-lg transition-all ${
                          sel ? 'border-tm-primary bg-[color-mix(in_oklch,var(--tm-primary)_10%,transparent)] font-semibold' : 'border-tm-border bg-tm-surface font-medium'
                        } text-tm-fg`}
                      >
                        <span
                          className={`inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 text-white ${
                            sel ? 'border-tm-primary bg-tm-primary' : 'border-tm-border bg-transparent'
                          }`}
                        >
                          {sel && <IconCheck size={13} />}
                        </span>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}

              {step.type === 'chips' && (
                <div className="flex flex-wrap gap-2.5">
                  {step.options?.map((opt) => {
                    const sel = (getAnswer(step.id) as string[]).includes(opt)
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleChip(step.id, opt)}
                        className={`inline-flex items-center gap-2 rounded-full border-[1.5px] px-4 py-2.5 text-tm-md font-semibold transition-all ${
                          sel ? 'border-tm-primary bg-[color-mix(in_oklch,var(--tm-primary)_12%,transparent)] text-tm-primary-deep' : 'border-tm-border bg-tm-surface text-tm-fg'
                        }`}
                      >
                        {sel ? <IconCheck size={15} /> : <IconPlus size={15} className="text-tm-fg-subtle" />}
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}

              {step.type === 'procedure' && (
                <div className="flex flex-col gap-2.5">
                  {PROCEDIMENTOS.map((opt) => {
                    const sel = procedimento === opt
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setProcedimento(opt)}
                        className={`flex items-center gap-3 rounded-tm-input border-[1.5px] px-4 py-3.5 text-left text-tm-lg transition-all ${
                          sel ? 'border-tm-primary bg-[color-mix(in_oklch,var(--tm-primary)_10%,transparent)] font-semibold' : 'border-tm-border bg-tm-surface font-medium'
                        } text-tm-fg`}
                      >
                        <span
                          className={`inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 text-white ${
                            sel ? 'border-tm-primary bg-tm-primary' : 'border-tm-border bg-transparent'
                          }`}
                        >
                          {sel && <IconCheck size={13} />}
                        </span>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {error && <div className="mt-3.5 text-tm-sm font-medium text-tm-error-text">{error}</div>}

            <div className="mt-7 flex justify-between gap-2.5 border-t border-tm-border pt-5">
              <Button variant="secondary" onClick={back} icon={<IconChevronLeft size={16} />}>
                {idx > 0 ? 'Anterior' : 'Cancelar'}
              </Button>
              <div className="flex gap-2.5">
                {step.optional && (
                  <Button variant="ghost" onClick={() => (idx < total - 1 ? setIdx(idx + 1) : setReview(true))}>
                    Pular
                  </Button>
                )}
                <Button onClick={next} iconRight={<IconArrowRight size={16} />}>
                  {idx < total - 1 ? 'Próxima' : 'Revisar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ReviewRow {
  stepIdx: number
  label: string
  value: string | null
}

interface FichaAoVivoReviewProps {
  paciente?: PacienteResumo
  avatarColor: AvatarColor
  data: string
  hora: string
  rows: ReviewRow[]
  loading: boolean
  onEdit: (idx: number) => void
  onFinish: () => void
}

function FichaAoVivoReview({ paciente, avatarColor, data, hora, rows, loading, onEdit, onFinish }: FichaAoVivoReviewProps) {
  return (
    <div>
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-tm-accent-green-bg px-3 py-1 text-tm-xs font-bold text-tm-accent-green-fg">
        <IconCheck size={14} /> Anamnese concluída
      </div>
      <div className="text-tm-5xl font-bold tracking-[-0.02em] text-tm-fg">Revise antes de salvar</div>

      {paciente && (
        <div className="mt-4.5 flex items-center gap-3 rounded-tm-input bg-tm-surface-2 p-3.5">
          <Avatar initials={obterIniciais(paciente.nome)} color={avatarColor} size={44} />
          <div>
            <div className="text-tm-lg font-bold text-tm-fg">{paciente.nome}</div>
            <div className="text-tm-base text-tm-fg-muted">
              {calcularIdade(paciente.dataNascimento)} anos · {new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')} · {hora}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col overflow-hidden rounded-tm-input border border-tm-border">
        {rows.map((r, i) => (
          <div key={r.stepIdx} className={`flex gap-3 p-4 ${i < rows.length - 1 ? 'border-b border-tm-border' : ''}`}>
            <div className="min-w-0 flex-1">
              <div className="text-tm-sm font-semibold uppercase tracking-[0.03em] text-tm-fg-subtle">{r.label}</div>
              <div className={`mt-0.5 whitespace-pre-wrap text-tm-md leading-[1.45] ${r.value ? 'text-tm-fg' : 'text-tm-fg-subtle'}`}>
                {r.value || '— não informado'}
              </div>
            </div>
            <button type="button" onClick={() => onEdit(r.stepIdx)} className="inline-flex shrink-0 p-1 text-tm-primary" aria-label="Editar">
              <IconEdit size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-2.5">
        <Button variant="secondary" onClick={() => onEdit(0)} disabled={loading}>
          Voltar
        </Button>
        <Button onClick={onFinish} icon={<IconCheck size={16} />} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar ficha'}
        </Button>
      </div>
    </div>
  )
}
