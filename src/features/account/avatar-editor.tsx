import { ImageIcon, LoaderCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/api-error'
import { Button } from '@/components/ui/button'
import { ImageInputError, resizeImageToDataUrl } from '@/lib/image-resize'
import { useRemoveAvatar, useUpdateAvatar } from './use-account'

export function AvatarEditor({ avatarUrl, name }: { avatarUrl: string | null; name: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const update = useUpdateAvatar()
  const remove = useRemoveAvatar()
  const busy = update.isPending || remove.isPending

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      update.mutate(dataUrl, {
        onSuccess: () => toast.success('Avatar atualizado.'),
        onError: (mutationError) => setError(getErrorMessage(mutationError)),
      })
    } catch (processingError) {
      setError(processingError instanceof ImageInputError ? processingError.message : 'Não foi possível processar a imagem.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-[0.95rem] tracking-wide">Avatar</legend>
      <div className="flex flex-wrap items-center gap-5">
        <span className="flex size-12 items-center justify-center overflow-hidden rounded-full border border-secondary bg-secondary/60 text-primary">
          {avatarUrl ? <img src={avatarUrl} alt={`Avatar de ${name}`} className="size-full object-cover" /> : <ImageIcon className="size-5" aria-hidden />}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <Button type="button" size="lg" className="h-10 px-6 font-bold" disabled={busy} onClick={() => inputRef.current?.click()}>
          {update.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          Alterar
          <span className="sr-only"> avatar (PNG, JPG ou WEBP até 5 MB)</span>
        </Button>
        {avatarUrl ? (
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              remove.mutate(undefined, {
                onSuccess: () => toast.success('Avatar removido.'),
                onError: (mutationError) => setError(getErrorMessage(mutationError)),
              })
            }
            className="text-sm tracking-wide underline-offset-4 hover:text-primary hover:underline disabled:opacity-50"
          >
            Remover<span className="sr-only"> avatar</span>
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
