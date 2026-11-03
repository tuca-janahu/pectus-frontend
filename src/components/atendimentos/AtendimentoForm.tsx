import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Button, Card, Dropdown, IconButton, Input, Select, StatusBadge } from '../ui'
import type { DropdownOption } from '../ui'
import { IconArrowLeft, IconCheck, IconClipboard, IconClose, IconEdit, IconStethoscope, IconUser, IconUserPlus } from '../icons'
import { PatientFormFields } from '../pacientes/PatientFormFields'
import { usePatientForm } from '../pacientes/usePatientForm'
import {
  EMPTY_CLINICAL_VALUES,
  clinicalValuesFromFicha,
  alterarSituacaoFicha,
  createAtendimento,
  iniciarAtendimento,
  listProcedimentos,
  updateAtendimento,
  type Atendimento,
  type FichaClinicalValues,
  type AtendimentoInput,
} from '../../lib/atendimentosStore'
import type { AtendimentoStatus } from '../ui'
import { useAuth } from '../../auth/AuthContext'
import { listPacientes, ApiError, type PacienteResumo } from '../../lib/api'
import { toastError, toastSuccess } from '../../lib/toast'
import { FichaClinicalFields } from './FichaClinicalFields'
import { AtendimentoMidias } from './AtendimentoMidias'

function hojeISO(): string {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
}

function proximoHorario(): { data: string; hora: string } {
  const proximo = new Date()
  proximo.setHours(proximo.getHours() + 1, 0, 0, 0)
  return {
    data: `${proximo.getFullYear()}-${String(proximo.getMonth() + 1).padStart(2, '0')}-${String(proximo.getDate()).padStart(2, '0')}`,
    hora: `${String(proximo.getHours()).padStart(2, '0')}:00`,
  }
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date()
  const nascimento = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nascimento.getFullYear()
  const m = hoje.getMonth() - nascimento.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) idade--
  return idade
}

interface AtendimentoFormProps {
  atendimento?: Atendimento
  pacienteIdInicial?: number
  dataInicial?: string
  onCancel: () => void
  onSuccess: (atendimento: Atendimento) => void
  onStarted?: (atendimento: Atendimento) => void
}

export function AtendimentoForm({ atendimento, pacienteIdInicial, dataInicial, onCancel, onSuccess, onStarted }: AtendimentoFormProps) {
  const isEditing = !!atendimento
  const { accessToken, user } = useAuth()

  // Paciente: ou seleciona um existente, ou cadastra um novo — nesse segundo
  // caso o mesmo botão de salvar cria o paciente e o atendimento em uma única ação.
  const [modoPaciente, setModoPaciente] = useState<'existente' | 'novo'>('existente')
  const [pacienteId, setPacienteId] = useState<number | ''>(atendimento?.pacienteId ?? pacienteIdInicial ?? '')
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([])
  const [procedimentos, setProcedimentos] = useState<Array<{ nome: string; descricao: string }>>([])
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const novoPacienteForm = usePatientForm()

  const [horarioPadrao] = useState(proximoHorario)
  const [data, setData] = useState(atendimento?.data || dataInicial || horarioPadrao.data)
  const [hora, setHora] = useState(atendimento?.hora || (dataInicial && dataInicial !== hojeISO() ? '09:00' : horarioPadrao.hora))
  const [procedimento, setProcedimento] = useState(atendimento?.procedimento || '')
  const [procedimentoOutro, setProcedimentoOutro] = useState(atendimento?.procedimentoOutro || '')
  const [status, setStatus] = useState<AtendimentoStatus>(atendimento?.status || 'agendada')
  const [descricao, setDescricao] = useState(atendimento?.descricao || '')
  const [situacao, setSituacao] = useState<Atendimento['situacao']>(atendimento?.situacao ?? 'EM_TRATAMENTO')
  const [motivoEncerramento, setMotivoEncerramento] = useState<Atendimento['motivoEncerramento']>(atendimento?.motivoEncerramento ?? null)
  const [dataEncerramento, setDataEncerramento] = useState(atendimento?.dataEncerramento?.slice(0, 10) ?? '')
  const [clinical, setClinical] = useState<FichaClinicalValues>(
    atendimento ? clinicalValuesFromFicha(atendimento) : { ...EMPTY_CLINICAL_VALUES },
  )
  const [error, setError] = useState<{ pacienteId?: string; data?: string; hora?: string; procedimento?: string }>({})
  const [loading, setLoading] = useState(false)

  const carregarPacientes = useCallback(async () => {
    if (!accessToken) return
    setLoadingPacientes(true)
    try {
      const { pacientes: lista } = await listPacientes(accessToken, undefined, true)
      setPacientes(lista)
    } catch (err) {
      toastError(err instanceof ApiError ? err.message : 'Não foi possível carregar os pacientes.')
    } finally {
      setLoadingPacientes(false)
    }
  }, [accessToken])

  useEffect(() => {
    carregarPacientes()
  }, [carregarPacientes])

  useEffect(() => {
    if (!accessToken) return
    listProcedimentos(accessToken).then(setProcedimentos).catch((error) => toastError(error.message))
  }, [accessToken])

  const pacienteOptions: DropdownOption[] = pacientes.map((p) => ({
    value: p.id,
    label: `${p.nome} — ${calcularIdade(p.dataNascimento)} anos`,
  }))

  const iniciar = async () => {
    if (!atendimento || !accessToken || loading) return
    setLoading(true)
    try {
      const iniciado = await iniciarAtendimento(accessToken, atendimento.id)
      onStarted?.(iniciado)
      setStatus('pendente')
      setClinical(clinicalValuesFromFicha(iniciado))
      setSituacao(iniciado.situacao)
      setMotivoEncerramento(iniciado.motivoEncerramento)
      setDataEncerramento(iniciado.dataEncerramento?.slice(0, 10) ?? '')
      toastSuccess('Atendimento iniciado. A ficha clínica está pronta para preenchimento.')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Não foi possível iniciar o atendimento.')
    } finally {
      setLoading(false)
    }
  }

  const salvar = async (concluir = false) => {
    const err: typeof error = {}
    if (modoPaciente === 'existente' && !pacienteId) {
      err.pacienteId = 'Selecione um paciente'
    } else if (modoPaciente === 'novo') {
      const patientError = novoPacienteForm.validate()
      if (patientError) err.pacienteId = patientError
    }
    if (!data) err.data = 'Informe a data'
    if (!hora) err.hora = 'Informe o horário'
    if (status === 'agendada' && data && hora) {
      const horarioEscolhido = new Date(`${data}T${hora}:00`)
      if (Number.isNaN(horarioEscolhido.getTime()) || horarioEscolhido <= new Date()) {
        err.hora = 'Escolha um horário futuro'
      }
    }
    if (!procedimento) err.procedimento = 'Selecione o procedimento'
    if (procedimento === 'Outro' && !procedimentoOutro.trim()) err.procedimento = 'Especifique o procedimento'
    if (concluir && !clinical.dataInjuriaTraqueal) {
      toastError('Informe a data da injúria traqueal antes de concluir.')
      return
    }
    if (situacao === 'FORA_DE_TRATAMENTO' && (!motivoEncerramento || !dataEncerramento)) {
      toastError('Informe motivo e data para a situação fora de tratamento.')
      return
    }
    setError(err)
    if (Object.keys(err).length) return

    setLoading(true)
    try {
      let finalPacienteId = pacienteId as number
      if (modoPaciente === 'novo') {
        const novoPaciente = await novoPacienteForm.submit()
        finalPacienteId = novoPaciente.id
        toastSuccess('Paciente cadastrado com sucesso.')
      }

      const input: AtendimentoInput = {
        pacienteId: finalPacienteId,
        data,
        hora,
        procedimento,
        procedimentoOutro,
        status: concluir ? 'concluida' : status,
        descricao,
        ...(status === 'pendente' || status === 'concluida' ? clinical : {}),
      }
      if (!accessToken) throw new Error('Sessão expirada. Entre novamente.')
      const medicoId = atendimento?.medicoId ?? user?.medico?.id
      if (!medicoId) throw new Error('Seu usuário não possui um perfil médico ativo.')
      const salva = isEditing
        ? await updateAtendimento(accessToken, medicoId, atendimento.id, input)
        : await createAtendimento(accessToken, medicoId, input)
      if (isEditing && (situacao !== atendimento.situacao || motivoEncerramento !== atendimento.motivoEncerramento || dataEncerramento !== (atendimento.dataEncerramento?.slice(0, 10) ?? ''))) {
        await alterarSituacaoFicha(accessToken, salva.id, situacao, situacao === 'EM_TRATAMENTO' ? null : motivoEncerramento, situacao === 'EM_TRATAMENTO' ? null : dataEncerramento)
      }
      toastSuccess(concluir ? 'Atendimento concluído com sucesso.' : isEditing ? 'Atendimento atualizado com sucesso.' : 'Atendimento agendado com sucesso.')
      onSuccess(salva)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Não foi possível salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const submitLabel = status === 'pendente' ? 'Salvar rascunho' : status === 'concluida' ? 'Salvar correção' : isEditing ? 'Salvar agendamento' : modoPaciente === 'novo' ? 'Criar paciente e agendar' : 'Agendar atendimento'

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-2 self-start rounded-tm-sm text-tm-sm font-medium text-tm-fg-muted transition-colors hover:text-tm-primary"
      >
        <IconArrowLeft size={16} />
        Voltar para os atendimentos
      </button>
      <Card padded={false} style={{ borderColor: 'color-mix(in oklch, var(--tm-primary) 35%, var(--tm-border))' }}>
        <div className="flex items-center gap-3 border-b border-tm-border bg-[color-mix(in_oklch,var(--tm-primary)_7%,var(--tm-surface))] px-5 py-4">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white">
          {isEditing ? <IconEdit size={20} /> : <IconClipboard size={20} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-tm-lg font-bold tracking-[-0.01em] text-tm-fg">
            {isEditing ? 'Editar atendimento' : 'Agendar atendimento'}
          </div>
          <div className="text-tm-sm text-tm-fg-muted">
            {isEditing ? 'Atualize os dados do procedimento.' : 'Defina paciente, horário e procedimento. A ficha clínica será preenchida após iniciar o atendimento.'}
          </div>
        </div>
        <IconButton icon={<IconClose size={20} />} label="Cancelar" onClick={onCancel} />
        </div>

        <form onSubmit={(event: FormEvent) => { event.preventDefault(); void salvar() }} className="flex flex-col gap-4 p-5">
        {atendimento && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-tm-input border border-tm-border bg-tm-surface-2 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-tm-sm font-semibold text-tm-fg-muted">Situação do atendimento</span>
              <StatusBadge status={status} />
            </div>
            {status === 'agendada' && user?.roles.includes('MEDICO') && user.medico?.id === atendimento.medicoId && (
              <Button type="button" size="sm" icon={<IconStethoscope size={16} />} onClick={iniciar} disabled={loading}>
                {loading ? 'Iniciando...' : 'Iniciar atendimento'}
              </Button>
            )}
          </div>
        )}
        <div className="border-b border-tm-border pb-2">
          <h3 className="text-tm-base font-semibold text-tm-fg">Paciente</h3>
          <p className="text-tm-sm text-tm-fg-muted">Selecione um cadastro existente ou cadastre um novo paciente.</p>
        </div>
        {modoPaciente === 'existente' ? (
          <div className="flex flex-col gap-2">
            <Dropdown
              label="Paciente"
              icon={<IconUser size={18} />}
              options={pacienteOptions}
              value={pacienteId}
              onChange={(v) => setPacienteId(Number(v))}
              placeholder={loadingPacientes ? 'Carregando pacientes...' : 'Selecione um paciente'}
              disabled={loading || loadingPacientes || isEditing}
              error={error.pacienteId}
              required
            />
            {!isEditing && <button
              type="button"
              onClick={() => setModoPaciente('novo')}
              disabled={loading}
              className="inline-flex items-center gap-1.5 self-start text-tm-sm font-semibold text-tm-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconUserPlus size={14} /> Paciente não encontrado? Cadastrar novo
            </button>}
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-tm-input border border-tm-border bg-tm-surface-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-tm-base font-semibold text-tm-fg">Novo paciente</span>
              <button
                type="button"
                onClick={() => setModoPaciente('existente')}
                disabled={loading}
                className="text-tm-sm font-semibold text-tm-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Selecionar paciente existente
              </button>
            </div>
            <PatientFormFields form={novoPacienteForm} loading={loading} />
            {error.pacienteId && <span className="text-tm-sm text-tm-error-text">{error.pacienteId}</span>}
          </div>
        )}

        <div className="mt-2 border-b border-tm-border pb-2">
          <h3 className="text-tm-base font-semibold text-tm-fg">Data e horário</h3>
          <p className="text-tm-sm text-tm-fg-muted">Cada atendimento reserva 60 minutos na agenda do paciente e do médico.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Data" type="date" min={!atendimento ? hojeISO() : undefined} value={data} onChange={(e) => { setData(e.target.value); setError((atual) => ({ ...atual, data: undefined, hora: undefined })) }} error={error.data} disabled={loading || (!!atendimento && status !== 'agendada')} required />
          <Input label="Horário" type="time" value={hora} onChange={(e) => { setHora(e.target.value); setError((atual) => ({ ...atual, hora: undefined })) }} error={error.hora} disabled={loading || (!!atendimento && status !== 'agendada')} required />
        </div>

        <div className="mt-2 border-b border-tm-border pb-2">
          <h3 className="text-tm-base font-semibold text-tm-fg">Procedimento</h3>
          <p className="text-tm-sm text-tm-fg-muted">Escolha o tipo de atendimento e registre orientações, se necessário.</p>
        </div>
        <Select
          label="Procedimento"
          value={procedimento}
          onChange={setProcedimento}
          options={procedimentos.map((p) => ({ value: p.nome, label: p.nome }))}
          placeholder="Selecione o tipo"
          error={error.procedimento}
          disabled={loading}
        />

        {procedimento === 'Outro' && (
          <Input label="Especifique o procedimento" value={procedimentoOutro} onChange={(e) => setProcedimentoOutro(e.target.value)} disabled={loading} required />
        )}

        {status === 'agendada' && atendimento && <p className="rounded-tm-input bg-tm-surface-2 px-3 py-2 text-tm-sm text-tm-fg-muted">Para preencher os dados clínicos, inicie o atendimento pelo botão no início desta página.</p>}
        {status === 'concluida' && <p className="rounded-tm-input bg-tm-surface-2 px-3 py-2 text-tm-sm text-tm-fg-muted">Atendimento concluído. Correções ficam registradas no histórico.</p>}

        {(status === 'pendente' || status === 'concluida') && (
          <FichaClinicalFields value={clinical} onChange={setClinical} disabled={loading} />
        )}

        {atendimento && (status === 'pendente' || status === 'concluida') && (
          <div className="flex flex-col gap-3 border-t border-tm-border pt-4">
            <Select label="Situação clínica da ficha" value={situacao} onChange={(value) => setSituacao(value as Atendimento['situacao'])}
              options={[{ value: 'EM_TRATAMENTO', label: 'Em tratamento' }, { value: 'FORA_DE_TRATAMENTO', label: 'Fora de tratamento' }]} disabled={loading} />
            {situacao === 'FORA_DE_TRATAMENTO' && <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Motivo" value={motivoEncerramento ?? ''} onChange={(value) => setMotivoEncerramento(value as Atendimento['motivoEncerramento'])}
                options={[{ value: 'ALTA', label: 'Alta' }, { value: 'ABANDONO', label: 'Abandono' }, { value: 'OBITO', label: 'Óbito' }]}
                placeholder="Selecione o motivo" disabled={loading} />
              <Input label="Data" type="date" value={dataEncerramento} onChange={(event) => setDataEncerramento(event.target.value)} disabled={loading} />
            </div>}
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-tm-base font-semibold text-tm-fg">Descrição / observações</span>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Detalhes do procedimento, achados, conduta..."
            rows={5}
            disabled={loading}
            className="min-h-[100px] resize-y rounded-tm-input border-[1.5px] border-tm-border bg-tm-surface px-3.5 py-3 font-[inherit] text-tm-md text-tm-fg outline-none transition-all focus:border-tm-primary focus:shadow-[0_0_0_4px_var(--tm-focus-ring)]"
          />
        </label>

        {atendimento && <AtendimentoMidias atendimentoId={atendimento.id} podeEditar={status !== 'cancelada' && (status === 'concluida' ? !!user?.roles.includes('MEDICO') : !!user?.roles.includes('ADMIN') || user?.medico?.id === atendimento.medicoId)} />}

        <div className="mt-2 flex justify-end gap-2.5 border-t border-tm-border pt-4">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" icon={<IconCheck size={16} />} disabled={loading || status === 'cancelada'}>
            {loading ? 'Salvando...' : submitLabel}
          </Button>
          {status === 'pendente' && (
            <Button type="button" icon={<IconStethoscope size={16} />} disabled={loading} onClick={() => void salvar(true)}>
              {loading ? 'Concluindo...' : 'Concluir atendimento'}
            </Button>
          )}
        </div>
        </form>
      </Card>
    </div>
  )
}
