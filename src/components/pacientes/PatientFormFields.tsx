import { Avatar, Dropdown, Input } from '../ui'
import { InputCpf } from '../ui/InputCpf'
import { InputPhone } from '../ui/InputPhone'
import { IconActivity, IconCamera, IconMapPin, IconUser } from '../icons'
import { AddressSelector } from './AddressSelector'
import { obterIniciais, type PatientFormState } from './usePatientForm'

const GENERO_OPTIONS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMININO', label: 'Feminino' },
  { value: 'OUTRO', label: 'Outro' },
]

interface PatientFormFieldsProps {
  form: PatientFormState
  loading?: boolean
}

// Campos do cadastro de paciente, extraídos de PatientForm para serem
// reaproveitados dentro do formulário de ficha (sem duplicar o formulário).
export function PatientFormFields({ form, loading = false }: PatientFormFieldsProps) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar size={64} src={form.fotoPreviewUrl ?? undefined} initials={obterIniciais(form.nome || '?')} />
          <button
            type="button"
            onClick={() => form.fotoInputRef.current?.click()}
            disabled={loading}
            className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-tm-surface bg-[linear-gradient(135deg,var(--tm-primary),var(--tm-primary-deep))] text-white shadow-tm-card disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Selecionar foto do paciente"
          >
            <IconCamera size={14} />
          </button>
          <input
            ref={form.fotoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={form.selecionarFoto}
            disabled={loading}
          />
        </div>
        <div className="min-w-0">
          <span className="block text-tm-base font-semibold text-tm-fg">Foto do paciente</span>
          <span className="block text-tm-sm text-tm-fg-muted">Opcional. JPEG, PNG ou WEBP, até 8MB.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Nome completo"
            value={form.nome}
            onChange={(e) => form.setNome(e.target.value)}
            placeholder="Ex: Artur Janahú"
            icon={<IconUser size={18} />}
            required
            disabled={loading}
          />
        </div>

        <InputCpf
          label="Documento (CPF)"
          value={form.documento}
          onChange={(e) => form.setDocumento(e.target.value)}
          placeholder="000.000.000-00"
          icon={<IconActivity size={18} />}
          required
          disabled={loading}
        />

        <InputPhone
          label="Telefone / Celular"
          value={form.telefone}
          onChange={(e) => form.setTelefone(e.target.value)}
          placeholder="(00) 00000-0000"
          required
          disabled={loading}
        />

        <Input
          label="Data de Nascimento"
          type="date"
          value={form.dataNascimento}
          onChange={(e) => form.setDataNascimento(e.target.value)}
          required
          disabled={loading}
        />

        <Dropdown
          label="Gênero"
          options={GENERO_OPTIONS}
          value={form.genero}
          onChange={(val) => form.setGenero(String(val))}
          required
          disabled={loading}
        />
      </div>

      <hr className="border-tm-border" />

      <div className="flex flex-col gap-4">
        <span className="flex items-center gap-2 text-tm-base font-semibold text-tm-fg">
          <IconMapPin size={18} className="text-tm-fg-muted" />
          Endereço
        </span>

        <AddressSelector value={form.enderecoNacional} onChange={form.setEnderecoNacional} disabled={loading} />
      </div>
    </>
  )
}
