import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import type { Cart, Quote } from '@/api/contracts/cart'
import type { User } from '@/api/contracts/session'
import { WALLET_NETWORK_LABELS, WALLET_PROVIDER_LABELS, type Wallet, type WalletNetwork, type WalletProvider } from '@/api/contracts/wallet'
import { ErrorState } from '@/components/feedback/query-states'
import { SelectField, TextAreaField, TextField } from '@/components/form/form-field'
import { NftImage } from '@/components/nft/nft-image'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/use-session'
import { useCart, useQuote } from '@/features/cart/use-cart'
import { CATALOG_SECTION_ID } from '@/features/catalog/catalog-search'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'
import { checkoutDefaults, checkoutFormSchema, walletDefaults, type CheckoutFormOutput, type CheckoutFormValues } from './checkout-form'
import { pendingOrder } from './order-attempts'
import { ReviewDialog } from './review-dialog'
import { useWallets } from './use-checkout'
import { ProviderPicker, SavedWallets } from './wallet-options'

const DRAFT_KEY = 'kurio.checkout-draft'
const FORM_ID = 'checkout-form'

function readDraft(userId: string): Partial<CheckoutFormValues> | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    const draft = raw ? (JSON.parse(raw) as { userId: string; values: Partial<CheckoutFormValues> }) : null
    return draft?.userId === userId ? draft.values : null
  } catch {
    return null
  }
}

function writeDraft(userId: string, values: Partial<CheckoutFormValues>): void {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ userId, values }))
  } catch {
    return
  }
}

function MobileHeader() {
  const canGoBack = useCanGoBack()
  const router = useRouter()
  const navigate = useNavigate()
  return (
    <div className="relative mb-5 flex items-center justify-center md:hidden">
      <button
        type="button"
        onClick={() => (canGoBack ? router.history.back() : void navigate({ to: '/cart' }))}
        aria-label="Voltar"
        className="absolute left-0 flex size-10 items-center justify-center rounded-full border border-primary/40 text-subtle"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <h1 className="text-lg font-bold tracking-wide">Pagamento com carteira</h1>
    </div>
  )
}

function PendingOrderBanner({ userId }: { userId: string }) {
  const orderId = pendingOrder.get(userId)
  if (!orderId) return null
  return (
    <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-primary bg-primary/10 px-4 py-3 text-sm">
      <span className="flex items-center gap-2">
        <Clock className="size-4 text-primary" aria-hidden />
        Você tem um pedido em processamento. Acompanhe antes de fazer outra compra.
      </span>
      <Button asChild size="sm" variant="outline">
        <Link to="/orders/$orderId" params={{ orderId }}>
          Ver pedido
        </Link>
      </Button>
    </div>
  )
}

function Totals({ quote, stale }: { quote: Quote | undefined; stale: boolean }) {
  if (!quote) {
    return (
      <div className="space-y-2" aria-hidden>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-5 w-full" />
        ))}
      </div>
    )
  }
  return (
    <dl className={cn('space-y-2 transition-opacity', stale && 'opacity-60')} aria-live="polite" aria-busy={stale}>
      <div className="flex justify-between gap-3">
        <dt>Subtotal</dt>
        <dd className="text-lg">{formatEth(quote.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt>{quote.discountLabel}</dt>
        <dd className="whitespace-nowrap">(-) {formatEth(quote.discount)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt>Taxa de rede</dt>
        <dd className="text-lg">{formatEth(quote.networkFee)}</dd>
      </div>
      <p className="text-center text-xs text-primary">{quote.networkFeeLabel}</p>
      <div className="flex justify-between gap-3 border-t border-secondary pt-3">
        <dt className="font-bold">Total</dt>
        <dd className="text-lg font-bold text-primary">{formatEth(quote.total)}</dd>
      </div>
    </dl>
  )
}

type CheckoutContentProps = {
  user: User
  cart: Cart
  quote: Quote | undefined
  quoteStale: boolean
  wallets: Wallet[]
}

function CheckoutContent({ user, cart, quote, quoteStale, wallets }: CheckoutContentProps) {
  const [reviewValues, setReviewValues] = useState<CheckoutFormOutput | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    control,
    subscribe,
    formState: { errors },
  } = useForm<CheckoutFormValues, unknown, CheckoutFormOutput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { ...checkoutDefaults(user, wallets), ...readDraft(user.id) },
  })

  useEffect(
    () => subscribe({ formState: { values: true }, callback: ({ values }) => writeDraft(user.id, values) }),
    [subscribe, user.id],
  )

  const walletId = useWatch({ control, name: 'walletId' })
  const provider = useWatch({ control, name: 'provider' }) as WalletProvider

  const selectWallet = (wallet: Wallet) => {
    for (const [key, value] of Object.entries(walletDefaults(wallet))) {
      setValue(key as keyof CheckoutFormValues, value as never, { shouldValidate: false, shouldDirty: true })
    }
  }

  const switchToOtherWallet = () => {
    setValue('walletId', null, { shouldDirty: true })
    setValue('address', '', { shouldDirty: true })
    document.getElementById('checkout-address')?.focus()
  }

  const onSubmit = handleSubmit((values) => {
    setReviewValues(values)
    setReviewOpen(true)
  })

  const canConfirm = Boolean(quote) && !quoteStale

  return (
    <>
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_25.3rem] lg:gap-8">
        <div className="space-y-8">
          <SavedWallets wallets={wallets} selectedId={walletId ?? null} onSelect={selectWallet} onUseOther={switchToOtherWallet} />

          <section aria-labelledby="buyer-title" className="space-y-4">
            <h2 id="buyer-title" className="text-lg font-bold">
              Perfil do colecionador
            </h2>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <TextField label="Nome de exibição" hideLabel={false} requiredMark autoComplete="name" error={errors.displayName?.message} {...register('displayName')} />
              <TextField label="Nome de usuário" hideLabel={false} requiredMark autoComplete="username" error={errors.username?.message} {...register('username')} />
              <SelectField
                label="Rede"
                requiredMark
                error={errors.network?.message}
                {...register('network', { onChange: () => setValue('walletId', null) })}
              >
                <option value="">Selecione uma rede</option>
                {(Object.keys(WALLET_NETWORK_LABELS) as WalletNetwork[]).map((network) => (
                  <option key={network} value={network}>
                    {WALLET_NETWORK_LABELS[network]}
                  </option>
                ))}
              </SelectField>
              <TextField label="Nome do perfil" hideLabel={false} requiredMark error={errors.profileName?.message} {...register('profileName')} />
              <TextField
                id="checkout-address"
                label="Endereço da carteira"
                hideLabel={false}
                requiredMark
                placeholder="Endereço 0x da carteira"
                autoComplete="off"
                spellCheck={false}
                error={errors.address?.message}
                {...register('address', { onChange: () => setValue('walletId', null) })}
              />
              <TextField
                label="ENS ou carteira secundária (opcional)"
                hideLabel={false}
                placeholder="ENS ou carteira secundária (opcional)"
                autoComplete="off"
                error={errors.secondary?.message}
                {...register('secondary')}
              />
              <SelectField
                label="Tipo de carteira"
                requiredMark
                error={errors.walletType?.message}
                {...register('walletType', {
                  onChange: (event: { target: { value: string } }) => {
                    setValue('walletId', null)
                    if (event.target.value) setValue('provider', event.target.value as WalletProvider)
                  },
                })}
              >
                <option value="">Selecione uma carteira</option>
                {(Object.keys(WALLET_PROVIDER_LABELS) as WalletProvider[]).map((item) => (
                  <option key={item} value={item}>
                    {WALLET_PROVIDER_LABELS[item]}
                  </option>
                ))}
              </SelectField>
              <TextField
                label="Código de indicação (opcional)"
                hideLabel={false}
                autoComplete="off"
                inputClassName="uppercase"
                error={errors.referralCode?.message}
                {...register('referralCode')}
              />
              <TextField label="E-mail" type="email" hideLabel={false} requiredMark autoComplete="email" error={errors.email?.message} {...register('email')} />
              <div>
                <div className="flex items-end gap-2">
                  <TextField
                    label="Nome ENS"
                    hideLabel={false}
                    requiredMark
                    autoComplete="off"
                    className="flex-1"
                    aria-describedby="ens-suffix"
                    error={errors.ensName?.message}
                    {...register('ensName')}
                  />
                  <span id="ens-suffix" className={cn('flex h-10 items-center rounded-sm border border-secondary px-3 text-sm', errors.ensName && 'mb-6')}>
                    .eth
                  </span>
                </div>
              </div>
            </div>

            <label className="flex w-fit cursor-pointer items-center gap-2 text-[0.95rem]">
              <input
                type="checkbox"
                checked={!walletId}
                onChange={(event) => (event.target.checked ? switchToOtherWallet() : wallets[0] && selectWallet(wallets[0]))}
                className="size-4 accent-primary"
              />
              Usar outra carteira?
            </label>

            <TextAreaField label="Observação do colecionador (opcional)" maxLength={280} className="max-w-[22rem]" error={errors.note?.message} {...register('note')} />
          </section>
        </div>

        <aside aria-labelledby="order-title" className="space-y-6 lg:self-start">
          <section className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 id="order-title" className="text-lg font-bold">
                Seus NFTs
              </h2>
              <span className="font-bold">Subtotal</span>
            </div>
            <ul className="space-y-3">
              {cart.items.map((line) => (
                <li key={line.id} className="flex items-center gap-3 bg-surface p-1 pr-3">
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl">
                    <NftImage image={line.image} sizes="64px" decorative />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{line.name}</p>
                    <p className="text-sm text-subtle">ID do token: {line.tokenId}</p>
                  </div>
                  <span className="text-sm text-subtle">(x {line.quantity})</span>
                  <span className="text-lg font-bold whitespace-nowrap text-primary">{formatEth(line.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <p className="text-center text-sm">
              Tem um código promocional?{' '}
              <Link to="/cart" className="text-primary underline-offset-4 hover:underline">
                Aplique aqui
              </Link>
            </p>
          </section>

          <Totals quote={quote} stale={quoteStale} />

          <ProviderPicker value={provider} onChange={(next) => setValue('provider', next, { shouldDirty: true })} />

          <Button type="submit" size="lg" className="hidden h-11 w-full text-base font-bold md:flex" disabled={!canConfirm}>
            Confirmar compra
          </Button>
        </aside>
      </form>

      <div className="sticky bottom-0 z-20 -mx-4 mt-8 space-y-3 border-t border-secondary bg-background/95 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur md:hidden">
        <p className="flex items-baseline justify-end gap-6 text-lg font-bold">
          Total:
          <span className="text-xl text-primary">{quote ? formatEth(quote.total) : '—'}</span>
        </p>
        <Button type="submit" form={FORM_ID} size="lg" className="h-14 w-full rounded-full bg-linear-to-r from-primary to-primary/70 text-base font-bold" disabled={!canConfirm}>
          Confirmar compra
        </Button>
      </div>

      {quote ? (
        <ReviewDialog open={reviewOpen} onOpenChange={setReviewOpen} values={reviewValues} cart={cart} quote={quote} quoteStale={quoteStale} />
      ) : null}
    </>
  )
}

export function CheckoutPage() {
  const { user } = useSession()
  const cartQuery = useCart()
  const cart = cartQuery.data
  const quoteQuery = useQuote(cart)
  const walletsQuery = useWallets()
  const [emptyOnArrival, setEmptyOnArrival] = useState<boolean | null>(null)

  if (cart && emptyOnArrival === null) setEmptyOnArrival(cart.items.length === 0)

  if (!user) return null
  if (emptyOnArrival) return <Navigate to="/cart" replace />

  const quoteStale = Boolean(quoteQuery.data && cart && quoteQuery.data.cartVersion !== cart.version) || quoteQuery.isFetching

  return (
    <div className="container-page pt-6 pb-10 md:pt-8">
      <MobileHeader />
      <nav aria-label="Trilha de navegação" className="mb-6 hidden md:block">
        <ol className="flex items-center gap-2 text-[0.95rem] font-bold">
          <li>
            <Link to="/" className="hover:text-primary">
              Início
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link to="/" hash={CATALOG_SECTION_ID} className="hover:text-primary">
              Mercado
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>
      <h1 className="sr-only max-md:hidden">Pagamento</h1>
      <PendingOrderBanner userId={user.id} />

      {cartQuery.isError && !cart ? (
        <ErrorState title="Não foi possível carregar o carrinho" error={cartQuery.error} onRetry={() => void cartQuery.refetch()} retrying={cartQuery.isFetching} />
      ) : walletsQuery.isError ? (
        <ErrorState title="Não foi possível carregar suas carteiras" error={walletsQuery.error} onRetry={() => void walletsQuery.refetch()} retrying={walletsQuery.isFetching} />
      ) : !cart || !walletsQuery.data ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25.3rem]" aria-busy="true" aria-label="Carregando pagamento">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 10 }, (_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : (
        cart.items.length === 0 ? (
          <div role="status" className="rounded-sm bg-surface px-6 py-12 text-center">
            <p className="mb-4 font-bold">Seu carrinho foi atualizado e não há itens para pagar.</p>
            <PendingOrderBanner userId={user.id} />
            <Button asChild>
              <Link to="/cart">Ir para o carrinho</Link>
            </Button>
          </div>
        ) : (
          <CheckoutContent user={user} cart={cart} quote={quoteQuery.data} quoteStale={quoteStale} wallets={walletsQuery.data.items} />
        )
      )}
    </div>
  )
}
