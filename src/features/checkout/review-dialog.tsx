import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { CircleCheck, LoaderCircle, TriangleAlert, Unplug } from 'lucide-react'
import { useState } from 'react'
import { isApiError, getErrorMessage } from '@/api/api-error'
import type { Cart, Quote } from '@/api/contracts/cart'
import type { PlaceOrderInput } from '@/api/contracts/order'
import { WALLET_NETWORK_LABELS, WALLET_PROVIDER_LABELS, walletNetworkSchema, type WalletConnection } from '@/api/contracts/wallet'
import { NftImage } from '@/components/nft/nft-image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useCartKey } from '@/features/cart/use-cart'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'
import { cartKeys } from '@/queries/cart-queries'
import { toPlaceOrderInput, type CheckoutFormOutput } from './checkout-form'
import { shortAddress } from './format-address'
import { useConnectWallet, usePlaceOrder } from './use-checkout'

type Problem = { kind: 'timeout' | 'changed' | 'error'; message: string }

type ReviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: CheckoutFormOutput | null
  cart: Cart
  quote: Quote
  quoteStale: boolean
}

export function ReviewDialog({ open, onOpenChange, values, cart, quote, quoteStale }: ReviewDialogProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { base } = useCartKey()
  const connect = useConnectWallet()
  const place = usePlaceOrder()
  const [connection, setConnection] = useState<WalletConnection | null>(null)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [lastInput, setLastInput] = useState<PlaceOrderInput | null>(null)

  if (!values) return null
  const provider = values.provider
  const network = walletNetworkSchema.parse(values.network)
  const blocked = quoteStale || quote.issues.some((issue) => issue.lineId !== null)

  const refreshQuote = () => {
    void queryClient.invalidateQueries({ queryKey: base, exact: true })
    void queryClient.invalidateQueries({ queryKey: cartKeys.quote(base) })
  }

  const handleConnect = () => {
    setProblem(null)
    connect.mutate(
      { provider, network, address: values.address },
      {
        onSuccess: setConnection,
        onError: (error) => setProblem({ kind: 'error', message: getErrorMessage(error) }),
      },
    )
  }

  const send = async (input: PlaceOrderInput) => {
    setProblem(null)
    setLastInput(input)
    try {
      const order = await place.submit(input)
      onOpenChange(false)
      void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    } catch (error) {
      if (isApiError(error) && (error.code === 'TIMEOUT' || error.code === 'NETWORK_ERROR')) {
        setProblem({
          kind: 'timeout',
          message: 'Não recebemos a resposta do servidor. Seu pedido pode já ter sido criado: tentar novamente reaproveita a mesma tentativa e não gera cobrança duplicada.',
        })
        return
      }
      if (isApiError(error) && error.code === 'CONFLICT') {
        refreshQuote()
        setProblem({ kind: 'changed', message: `${error.message} Confira os novos valores abaixo e confirme novamente.` })
        return
      }
      setProblem({ kind: 'error', message: getErrorMessage(error) })
    }
  }

  const handlePay = () => {
    if (!connection) return
    void send(toPlaceOrderInput(values, connection, cart, quote))
  }

  const handleOpenChange = (next: boolean) => {
    if (place.isPending) return
    if (!next) {
      setProblem(null)
      connect.reset()
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-none border-0 border-b-[6px] border-b-primary bg-surface p-6 sm:max-w-[34rem] sm:p-8">
        <DialogTitle className="text-xl font-bold">Revise seu pedido</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-subtle">
          Confira os itens e os valores. A compra só é enviada depois que você conectar a carteira e confirmar o pagamento.
        </DialogDescription>

        <ul className="mt-5 space-y-2" aria-label="Itens do pedido">
          {cart.items.map((line) => (
            <li key={line.id} className="flex items-center gap-3 rounded-sm bg-background/60 p-2">
              <div className="size-12 shrink-0 overflow-hidden rounded-sm">
                <NftImage image={line.image} sizes="48px" decorative />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{line.name}</p>
                <p className="text-xs text-subtle">
                  Edição {line.editionLabel} · {line.quantity} × {formatEth(line.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-bold text-primary">{formatEth(line.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <dl className={cn('mt-4 space-y-1.5 text-sm transition-opacity', quoteStale && 'opacity-80')} aria-busy={quoteStale} aria-live="polite">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatEth(quote.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{quote.discountLabel}</dt>
            <dd>(-) {formatEth(quote.discount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Taxa de rede</dt>
            <dd>{formatEth(quote.networkFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-secondary pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="text-primary">{formatEth(quote.total)}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-sm border border-secondary p-3 text-sm">
          <p className="font-bold">Pagamento</p>
          <p className="text-subtle">
            {WALLET_PROVIDER_LABELS[provider]} · {WALLET_NETWORK_LABELS[network]} · {shortAddress(values.address)}
          </p>
          {connection ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-primary" role="status">
                <CircleCheck className="size-4" aria-hidden />
                Carteira conectada
              </p>
              <button
                type="button"
                onClick={() => setConnection(null)}
                disabled={place.isPending}
                className="flex items-center gap-1.5 text-xs text-subtle underline-offset-4 hover:text-primary hover:underline"
              >
                <Unplug className="size-3.5" aria-hidden />
                Desconectar
              </button>
            </div>
          ) : null}
        </div>

        <div aria-live="assertive">
          {problem ? (
            <div role="alert" className="mt-4 flex gap-2 rounded-sm border border-primary bg-primary/10 p-3 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <p>{problem.message}</p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {blocked && !quoteStale ? (
            <Button asChild variant="outline" size="lg">
              <Link to="/cart">Revisar itens no carrinho</Link>
            </Button>
          ) : !connection ? (
            <Button size="lg" className="h-11 font-bold" onClick={handleConnect} disabled={connect.isPending || blocked}>
              {connect.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
              {connect.isPending ? `Aguardando aprovação na ${WALLET_PROVIDER_LABELS[provider]}…` : `Conectar ${WALLET_PROVIDER_LABELS[provider]}`}
            </Button>
          ) : problem?.kind === 'timeout' && lastInput ? (
            <Button size="lg" className="h-11 font-bold" onClick={() => void send(lastInput)} disabled={place.isPending}>
              {place.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
              Tentar novamente
            </Button>
          ) : (
            <Button size="lg" className="h-11 font-bold" onClick={handlePay} disabled={place.isPending || blocked} aria-busy={place.isPending}>
              {place.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
              {place.isPending ? 'Enviando pedido…' : `Pagar ${formatEth(quote.total)}`}
            </Button>
          )}
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={place.isPending}>
            Voltar e editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
