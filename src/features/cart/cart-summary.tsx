import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { LoaderCircle, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { isApiError, getErrorMessage } from '@/api/api-error'
import { applyCouponInputSchema, type ApplyCouponInput, type Cart, type Quote } from '@/api/contracts/cart'
import { InlineError } from '@/components/feedback/query-states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'
import { useAcknowledgeCart, useApplyCoupon, useRemoveCoupon } from './use-cart'

function CouponForm({ appliedCode }: { appliedCode: string | null }) {
  const applyMutation = useApplyCoupon()
  const removeMutation = useRemoveCoupon()
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ApplyCouponInput>({ resolver: zodResolver(applyCouponInputSchema), defaultValues: { code: '' } })

  const onSubmit = handleSubmit(({ code }) => {
    applyMutation.mutate(code.toUpperCase(), {
      onSuccess: () => reset({ code: '' }),
      onError: (error) =>
        setError('code', { type: 'server', message: isApiError(error) ? (error.fields.code ?? error.message) : getErrorMessage(error) }, { shouldFocus: true }),
    })
  })

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-sm border border-primary/60 bg-primary/10 px-3 py-2 text-sm">
        <span>
          Cupom <strong className="text-primary">{appliedCode}</strong> aplicado
        </span>
        <button
          type="button"
          onClick={() => removeMutation.mutate()}
          disabled={removeMutation.isPending}
          aria-label={`Remover cupom ${appliedCode}`}
          className="flex size-7 items-center justify-center rounded-sm hover:text-primary"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="coupon-code" className="mb-2 block text-sm font-bold">
        Código promocional
      </label>
      <div className="flex">
        <input
          id="coupon-code"
          autoComplete="off"
          placeholder="Digite o código promocional..."
          aria-invalid={errors.code ? true : undefined}
          aria-describedby={errors.code ? 'coupon-error' : undefined}
          className="h-10 min-w-0 flex-1 rounded-l-sm rounded-r-none border border-primary bg-transparent px-3 text-xs tracking-wide uppercase placeholder:normal-case placeholder:text-muted-foreground focus-visible:outline-none aria-invalid:border-destructive max-md:h-11 max-md:rounded-l-full max-md:border-secondary max-md:bg-background"
          {...register('code')}
        />
        <button
          type="submit"
          disabled={applyMutation.isPending}
          className="flex h-10 items-center gap-2 rounded-r-sm bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/85 disabled:opacity-60 max-md:-ml-6 max-md:h-11 max-md:rounded-full max-md:bg-linear-to-r max-md:from-primary max-md:to-primary/70"
        >
          {applyMutation.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          Aplicar
        </button>
      </div>
      {errors.code ? (
        <p id="coupon-error" role="alert" className="mt-1.5 text-xs text-destructive">
          {errors.code.message}
        </p>
      ) : null}
    </form>
  )
}

function Row({ label, value, hint, emphasis = false }: { label: string; value: string; hint?: string; emphasis?: boolean }) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-3', emphasis && 'pt-3')}>
      <dt className={cn('min-w-0', emphasis ? 'font-bold' : 'text-[0.95rem]')}>{label}</dt>
      <dd className={cn('shrink-0 whitespace-nowrap tabular-nums', emphasis ? 'text-lg font-bold text-primary' : 'text-base')}>{value}</dd>
      {hint ? <dd className="basis-full text-right text-xs text-primary">{hint}</dd> : null}
    </div>
  )
}

type CartSummaryProps = {
  cart: Cart
  quote: Quote | undefined
  quoteError: unknown
  quoteLoading: boolean
  quoteRefreshing: boolean
  onRetryQuote: () => void
  onCheckout: () => void
  className?: string
}

export function CartSummary({ cart, quote, quoteError, quoteLoading, quoteRefreshing, onRetryQuote, onCheckout, className }: CartSummaryProps) {
  const acknowledge = useAcknowledgeCart()
  const reviewIssues = quote?.issues.filter((issue) => issue.lineId !== null) ?? []
  const blocking = reviewIssues.length > 0
  const outdated = Boolean(quote && quote.cartVersion !== cart.version)

  return (
    <section aria-labelledby="summary-title" className={cn('space-y-5', className)}>
      <h2 id="summary-title" className="hidden border-b border-secondary pb-2 text-lg font-bold md:block">
        Resumo da carteira
      </h2>
      <CouponForm appliedCode={cart.couponCode} />

      {quoteError && !quote ? (
        <InlineError error={quoteError} onRetry={onRetryQuote} retrying={quoteRefreshing} />
      ) : quoteLoading || !quote ? (
        <div className="space-y-3" aria-hidden>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-6 w-full" />
          ))}
        </div>
      ) : (
        <div aria-live="polite" aria-busy={quoteRefreshing || outdated} className={cn('transition-opacity', (quoteRefreshing || outdated) && 'opacity-80')}>
          <dl className="space-y-2">
            <Row label="Subtotal" value={formatEth(quote.subtotal)} />
            <Row label={quote.discountLabel} value={`(-) ${formatEth(quote.discount)}`} />
            <Row label="Taxa de rede" value={formatEth(quote.networkFee)} hint={quote.networkFeeLabel} />
            <Row label="Total" value={formatEth(quote.total)} emphasis />
          </dl>
          {quote.issues.some((issue) => issue.lineId === null) ? (
            <ul className="mt-3 space-y-1 text-xs text-primary" role="status">
              {quote.issues
                .filter((issue) => issue.lineId === null)
                .map((issue) => (
                  <li key={issue.message}>⚠ {issue.message}</li>
                ))}
            </ul>
          ) : null}
        </div>
      )}

      {blocking ? (
        <div role="alert" className="space-y-3 rounded-sm border border-primary bg-primary/10 p-3 text-sm">
          <p className="font-bold">Seu carrinho mudou desde a última cotação</p>
          <ul className="space-y-1 text-xs">
            {reviewIssues.map((issue) => (
              <li key={`${issue.kind}-${issue.lineId}`}>{issue.message}</li>
            ))}
          </ul>
          <Button size="sm" variant="outline" onClick={() => acknowledge.mutate()} disabled={acknowledge.isPending}>
            {acknowledge.isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
            Aceitar alterações e atualizar
          </Button>
        </div>
      ) : null}

      <div className="space-y-3 text-center">
        <Button
          size="lg"
          className="h-11 w-full text-base font-bold max-md:h-14 max-md:rounded-full max-md:bg-linear-to-r max-md:from-primary max-md:to-primary/70"
          disabled={!quote || blocking || outdated || quoteRefreshing}
          onClick={onCheckout}
        >
          Conectar e finalizar
        </Button>
        <Link to="/" className="hidden text-primary underline-offset-4 hover:underline md:inline-block">
          Continuar explorando
        </Link>
      </div>
    </section>
  )
}
