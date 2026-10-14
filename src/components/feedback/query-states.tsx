import { RotateCw, SearchX, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { getErrorMessage } from '@/api/api-error'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  title?: string
  error: unknown
  onRetry: () => void
  retrying?: boolean
  className?: string
}

export function ErrorState({ title = 'Não foi possível carregar', error, onRetry, retrying = false, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn('flex flex-col items-center rounded-sm bg-surface px-6 py-12 text-center', className)}>
      <TriangleAlert className="mb-4 size-8 text-primary" aria-hidden />
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-subtle">{getErrorMessage(error)}</p>
      <Button onClick={onRetry} disabled={retrying}>
        <RotateCw className={cn(retrying && 'animate-spin')} aria-hidden />
        {retrying ? 'Tentando…' : 'Tentar novamente'}
      </Button>
    </div>
  )
}

type InlineErrorProps = {
  error: unknown
  onRetry: () => void
  retrying?: boolean
}

export function InlineError({ error, onRetry, retrying = false }: InlineErrorProps) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm">
      <span className="flex items-center gap-2">
        <TriangleAlert className="size-4 shrink-0 text-destructive" aria-hidden />
        Não foi possível atualizar. {getErrorMessage(error)}
      </span>
      <Button size="sm" variant="outline" onClick={onRetry} disabled={retrying}>
        Tentar novamente
      </Button>
    </div>
  )
}

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center rounded-sm bg-surface px-6 py-12 text-center', className)}>
      <SearchX className="mb-4 size-8 text-primary" aria-hidden />
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      {description ? <p className="mb-6 max-w-sm text-sm text-subtle">{description}</p> : null}
      {action}
    </div>
  )
}
