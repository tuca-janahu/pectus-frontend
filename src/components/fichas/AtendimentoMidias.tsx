import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { IconCamera } from '../icons'
import { listMidias, removerMidia, uploadMidia, type MidiaAtendimento } from '../../lib/fichasStore'
import { toastError, toastSuccess } from '../../lib/toast'

const LIMITE_VIDEO_MB = Number(import.meta.env.VITE_MAX_VIDEO_MB ?? 100)

export function AtendimentoMidias({ atendimentoId, podeEditar, embedded = false }: { atendimentoId: number; podeEditar: boolean; embedded?: boolean }) {
  const { accessToken } = useAuth()
  const [midias, setMidias] = useState<MidiaAtendimento[]>([])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    listMidias(accessToken, atendimentoId).then(setMidias).catch((error) => toastError(error.message))
  }, [accessToken, atendimentoId])

  const enviar = async (arquivo?: File) => {
    if (!arquivo || !accessToken) return
    const imagem = arquivo.type === 'image/jpeg' || arquivo.type === 'image/png'
    const video = arquivo.type === 'video/mp4'
    if ((!imagem && !video) || (imagem && arquivo.size > 5 * 1024 * 1024) || (video && arquivo.size > LIMITE_VIDEO_MB * 1024 * 1024)) {
      toastError(`Use JPG/PNG até 5 MB ou MP4 até ${LIMITE_VIDEO_MB} MB.`)
      return
    }
    setEnviando(true)
    try {
      const midia = await uploadMidia(accessToken, atendimentoId, arquivo)
      setMidias((anteriores) => [...anteriores, midia])
      toastSuccess('Mídia adicionada ao atendimento.')
    } catch (error) { toastError(error instanceof Error ? error.message : 'Falha no envio.') }
    finally { setEnviando(false) }
  }

  const remover = async (midiaId: number) => {
    if (!accessToken || !window.confirm('Ocultar esta mídia do atendimento? O registro será preservado.')) return
    try {
      await removerMidia(accessToken, atendimentoId, midiaId)
      setMidias((anteriores) => anteriores.filter((midia) => midia.id !== midiaId))
    } catch (error) { toastError(error instanceof Error ? error.message : 'Falha ao remover mídia.') }
  }

  return (
    <section className={`flex flex-col gap-3 ${embedded ? '' : 'border-t border-tm-border pt-4'}`}>
      {!embedded && <h3 className="text-tm-base font-semibold text-tm-fg">Fotos e vídeos deste atendimento</h3>}
      {podeEditar && <label className="cursor-pointer self-start rounded-tm-button border border-tm-border px-3 py-2 text-tm-sm text-tm-primary">
        {enviando ? 'Enviando...' : 'Adicionar imagem ou vídeo'}
        <input className="hidden" type="file" accept="image/jpeg,image/png,video/mp4" disabled={enviando} onChange={(event) => {
          void enviar(event.target.files?.[0]); event.target.value = ''
        }} />
      </label>}
      {midias.length === 0 ? <div className="flex flex-col items-center gap-2 rounded-tm-card border border-dashed border-tm-border bg-tm-surface-2 px-4 py-8 text-center">
        <IconCamera size={24} className="text-tm-fg-subtle" />
        <p className="text-tm-sm text-tm-fg-muted">Nenhuma foto ou vídeo registrado neste atendimento.</p>
      </div> : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {midias.map((midia) => <div key={midia.id} className="min-w-0 overflow-hidden rounded-tm-card border border-tm-border bg-tm-surface">
            {midia.mimeType === 'video/mp4'
              ? <video controls preload="metadata" src={midia.url} className="aspect-video w-full bg-black object-contain" />
              : <img src={midia.url} alt={midia.nomeOriginal} loading="lazy" className="aspect-video w-full bg-tm-surface-2 object-contain" />}
            <div className="flex items-center justify-between gap-2 px-3 py-2 text-tm-xs text-tm-fg-muted">
              <span className="min-w-0 truncate" title={midia.nomeOriginal}>{midia.nomeOriginal}</span>
              {podeEditar && <button type="button" onClick={() => void remover(midia.id)} className="text-tm-error-text">Remover</button>}
            </div>
          </div>)}
        </div>
      )}
    </section>
  )
}
