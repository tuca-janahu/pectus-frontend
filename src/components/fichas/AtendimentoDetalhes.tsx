import { useState } from 'react'
import { IconActivity, IconCamera, IconChevronDown, IconClock } from '../icons'
import type { Ficha } from '../../lib/fichasStore'
import { AtendimentoMidias } from './AtendimentoMidias'

type Aba = 'detalhes' | 'alteracoes' | 'midias'
type Evento = Ficha['historico'][number]

const EVENTOS: Record<string, string> = {
  CRIADO: 'Atendimento criado',
  INICIADO: 'Atendimento iniciado',
  REAGENDADO: 'Agendamento atualizado',
  FICHA_ALTERADA: 'Ficha clínica atualizada',
  ATENDIMENTO_CORRIGIDO: 'Atendimento corrigido',
  CONCLUIDO: 'Atendimento concluído',
  CANCELADO: 'Atendimento cancelado',
  SITUACAO_ALTERADA: 'Situação clínica atualizada',
  MIDIA_ADICIONADA: 'Mídia adicionada',
  MIDIA_REMOVIDA: 'Mídia removida',
}

const CAMPOS: Record<string, string> = {
  status: 'Status',
  medicoId: 'Médico responsável',
  dataHoraPrevista: 'Data e horário',
  procedimento: 'Procedimento',
  procedimentoOutro: 'Outro procedimento',
  observacoes: 'Observações',
  mecanismoLesao: 'Mecanismo da lesão',
  dataInjuriaTraqueal: 'Data da injúria traqueal',
  vocaliza: 'Vocaliza',
  traqueostomizado: 'Traqueostomizado',
  possuiComorbidades: 'Possui comorbidades',
  comorbidadesDescricao: 'Comorbidades',
  possuiSequelas: 'Possui sequelas',
  sequelasDescricao: 'Sequelas',
  usaMedicamentos: 'Usa medicamentos',
  medicamentosDescricao: 'Medicamentos',
  possuiLaringoscopia: 'Possui laringoscopia',
  achadoLaringoscopia: 'Achado da laringoscopia',
  particularidades: 'Particularidades',
  situacao: 'Situação clínica',
  motivoEncerramento: 'Motivo de encerramento',
  dataEncerramento: 'Data de encerramento',
  nomeOriginal: 'Arquivo',
  mimeType: 'Tipo de arquivo',
}

const VALORES: Record<string, string> = {
  AGENDADA: 'Agendado',
  EM_PREENCHIMENTO: 'Em preenchimento',
  CONCLUIDA: 'Concluído',
  CANCELADA: 'Cancelado',
  EM_TRATAMENTO: 'Em tratamento',
  FORA_DE_TRATAMENTO: 'Fora de tratamento',
  ALTA: 'Alta',
  ABANDONO: 'Abandono',
  OBITO: 'Óbito',
  'image/jpeg': 'Imagem JPEG',
  'image/png': 'Imagem PNG',
  'video/mp4': 'Vídeo MP4',
}

function formatarValor(campo: string, valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return 'Não informado'
  if (typeof valor === 'boolean') return valor ? 'Sim' : 'Não'
  if (campo === 'medicoId') return `Médico #${valor}`
  if (typeof valor === 'string') {
    if (VALORES[valor]) return VALORES[valor]
    if (campo === 'dataHoraPrevista' || campo === 'dataInjuriaTraqueal' || campo === 'dataEncerramento') {
      const data = new Date(valor)
      if (!Number.isNaN(data.getTime())) {
        return campo === 'dataHoraPrevista'
          ? data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
          : new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(data)
      }
    }
    return valor
  }
  return typeof valor === 'object' ? JSON.stringify(valor) : String(valor)
}

function formatarMomento(valor: string): string {
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? valor : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function Mudancas({ evento }: { evento: Evento }) {
  const campos = Object.entries(evento.campos ?? {}).filter(([campo]) => campo !== 'midiaId')
  if (campos.length === 0) return null

  return (
    <div className="mt-2 divide-y divide-tm-border rounded-tm-sm border border-tm-border bg-tm-surface">
      {campos.map(([campo, mudanca]) => {
        const comparacao = mudanca !== null && typeof mudanca === 'object' && 'antes' in mudanca && 'depois' in mudanca
        return (
          <div key={campo} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-3 py-2 text-tm-sm">
            <span className="min-w-32 font-medium text-tm-fg">{CAMPOS[campo] ?? campo}</span>
            {comparacao ? (
              <span className="break-words text-tm-fg-muted">
                {formatarValor(campo, mudanca.antes)} <span aria-label="alterado para" className="px-1 text-tm-fg-subtle">→</span> <span className="font-medium text-tm-fg">{formatarValor(campo, mudanca.depois)}</span>
              </span>
            ) : <span className="break-words text-tm-fg-muted">{formatarValor(campo, mudanca)}</span>}
          </div>
        )
      })}
    </div>
  )
}

export function AtendimentoDetalhes({ ficha }: { ficha: Ficha }) {
  const [aberto, setAberto] = useState(false)
  const [aba, setAba] = useState<Aba>('detalhes')
  const painelId = `atendimento-${ficha.id}-painel`
  const abas: Array<{ id: Aba; label: string; icon: typeof IconActivity }> = [
    { id: 'detalhes', label: 'Detalhes', icon: IconActivity },
    { id: 'alteracoes', label: `Alterações (${ficha.historico.length})`, icon: IconClock },
    { id: 'midias', label: 'Mídias', icon: IconCamera },
  ]

  return (
    <div className="overflow-hidden rounded-tm-card border border-tm-border bg-tm-surface">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-tm-sm font-semibold text-tm-primary transition-colors hover:bg-tm-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-tm-primary"
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={() => setAberto((valor) => !valor)}
      >
        <span>{aberto ? 'Ocultar registro do atendimento' : 'Ver registro do atendimento'}</span>
        <IconChevronDown size={18} className={`shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div id={painelId} className="border-t border-tm-border">
          <div className="flex gap-1 overflow-x-auto border-b border-tm-border px-3 pt-2" role="group" aria-label={`Seções do atendimento ${ficha.id}`}>
            {abas.map(({ id, label, icon: Icone }) => (
              <button
                key={id}
                type="button"
                aria-pressed={aba === id}
                aria-controls={`${painelId}-conteudo`}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-tm-sm px-3 py-2 text-tm-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-tm-primary ${aba === id ? 'bg-[color-mix(in_oklch,var(--tm-primary)_12%,var(--tm-surface))] text-tm-primary' : 'text-tm-fg-muted hover:bg-tm-surface-2 hover:text-tm-fg'}`}
                onClick={() => setAba(id)}
              >
                <Icone size={16} />{label}
              </button>
            ))}
          </div>

          <div id={`${painelId}-conteudo`} className="p-4">
            {aba === 'detalhes' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-tm-card border border-tm-border bg-tm-surface-2 p-4">
                  <h4 className="mb-2 text-tm-xs font-semibold uppercase tracking-wide text-tm-fg-subtle">Procedimento</h4>
                  <p className="text-tm-base font-medium text-tm-fg">{ficha.procedimento || 'Não informado'}</p>
                  {ficha.procedimentoOutro && <p className="mt-1 text-tm-sm text-tm-fg-muted">{ficha.procedimentoOutro}</p>}
                </div>
                <div className="rounded-tm-card border border-tm-border bg-tm-surface-2 p-4">
                  <h4 className="mb-2 text-tm-xs font-semibold uppercase tracking-wide text-tm-fg-subtle">Observações</h4>
                  <p className="whitespace-pre-wrap break-words text-tm-sm text-tm-fg">{ficha.descricao || 'Nenhuma observação registrada.'}</p>
                </div>
              </div>
            )}

            {aba === 'alteracoes' && (
              ficha.historico.length === 0 ? (
                <p className="text-tm-sm text-tm-fg-muted">Nenhuma alteração registrada neste atendimento.</p>
              ) : (
                <ol className="space-y-3">
                  {ficha.historico.map((evento, index) => (
                    <li key={`${evento.em}-${index}`} className="flex gap-3">
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-tm-primary" aria-hidden="true" />
                      <div className="min-w-0 flex-1 rounded-tm-card border border-tm-border bg-tm-surface-2 p-3">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <span className="text-tm-sm font-semibold text-tm-fg">{EVENTOS[evento.tipo] ?? evento.tipo}</span>
                          <time dateTime={evento.em} className="text-tm-xs text-tm-fg-subtle">{formatarMomento(evento.em)}</time>
                        </div>
                        <p className="mt-0.5 text-tm-xs text-tm-fg-muted">Registrado por {evento.autorEmail || 'conta não identificada'}</p>
                        <Mudancas evento={evento} />
                      </div>
                    </li>
                  ))}
                </ol>
              )
            )}

            {aba === 'midias' && <AtendimentoMidias atendimentoId={ficha.id} podeEditar={false} embedded />}
          </div>
        </div>
      )}
    </div>
  )
}
