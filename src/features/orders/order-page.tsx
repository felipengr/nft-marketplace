import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CircleX, ExternalLink, LoaderCircle } from 'lucide-react'
import { useEffect } from 'react'
import { isApiError } from '@/api/api-error'
import type { Order } from '@/api/contracts/order'
import { WALLET_NETWORK_LABELS, WALLET_PROVIDER_LABELS } from '@/api/contracts/wallet'
import { ErrorState } from '@/components/feedback/query-states'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { NftImage } from '@/components/nft/nft-image'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/use-session'
import { pendingOrder } from '@/features/checkout/order-attempts'
import { shortAddress } from '@/features/checkout/format-address'
import { formatEth } from '@/lib/money'
import { orderQueryOptions } from '@/queries/checkout-queries'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

function ThankYouIcon() {
  return (
    <svg viewBox="0 0 64 64" className="size-16 text-primary" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 26 32 8l24 18v28a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" />
      <path d="M8 26l24 18 24-18" />
      <rect x="16" y="14" width="32" height="20" rx="2" fill="var(--surface)" />
      <text x="32" y="22" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" stroke="none">
        THANK
      </text>
      <text x="32" y="30" textAnchor="middle" fontSize="7" fontWeight="700" fill="currentColor" stroke="none">
        YOU
      </text>
    </svg>
  )
}

function SummaryBand({ order }: { order: Order }) {
  const items = [
    { label: 'ID da transação', value: order.transaction ? shortAddress(order.transaction.hash) : shortAddress(order.id) },
    { label: 'Data', value: dateFormatter.format(new Date(order.transaction?.confirmedAt ?? order.createdAt)) },
    { label: 'Total', value: formatEth(order.total) },
    { label: 'Carteira', value: WALLET_PROVIDER_LABELS[order.wallet.provider] },
  ]
  return (
    <dl className="grid grid-cols-2 gap-4 border-y border-primary px-6 py-4 text-sm sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-primary">
      {items.map((item) => (
        <div key={item.label} className="sm:px-4 sm:first:pl-0">
          <dt className="font-bold">{item.label}</dt>
          <dd className="text-subtle tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Items({ order }: { order: Order }) {
  return (
    <div className="px-6 sm:px-10">
      <h2 className="mt-6 text-sm font-bold">Detalhes da transação</h2>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-secondary text-left">
            <th scope="col" className="py-2 font-bold">
              NFTs
            </th>
            <th scope="col" className="py-2 text-center font-bold">
              Edições
            </th>
            <th scope="col" className="py-2 text-right font-bold">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={`${item.nftId}-${item.editionId}`}>
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-xl">
                    <NftImage image={item.image} sizes="56px" decorative />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{item.name}</p>
                    <p className="text-xs text-subtle">
                      ID do token: {item.tokenId} · Edição {item.editionLabel}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-3 text-center text-subtle">(x {item.quantity})</td>
              <td className="py-3 text-right font-bold whitespace-nowrap text-primary">{formatEth(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-2 space-y-1 border-b border-secondary pb-3 text-sm">
        {order.couponCode ? (
          <div className="flex justify-end gap-8">
            <dt>Desconto ({order.couponCode})</dt>
            <dd className="w-28 text-right">(-) {formatEth(order.discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-end gap-8">
          <dt>Taxa de rede</dt>
          <dd className="w-28 text-right">{formatEth(order.networkFee)}</dd>
        </div>
        <div className="flex justify-end gap-8 text-base font-bold">
          <dt>Total</dt>
          <dd className="w-28 text-right text-primary">{formatEth(order.total)}</dd>
        </div>
      </dl>
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const network = WALLET_NETWORK_LABELS[order.wallet.network].replace('Rede principal ', '').replace('Rede ', '')

  if (order.status === 'pending') {
    return (
      <>
        <div className="flex flex-col items-center gap-3 px-6 pt-10 pb-6 text-center" role="status" aria-live="polite">
          <LoaderCircle className="size-12 animate-spin text-primary" aria-hidden />
          <h1 className="text-xl font-bold">Aguardando confirmação na rede</h1>
          <p className="max-w-md text-sm text-subtle">
            Seu pedido foi enviado. Você pode atualizar a página ou sair: o status é recuperado automaticamente e nenhuma compra duplicada será criada.
          </p>
        </div>
        <SummaryBand order={order} />
        <Items order={order} />
        <div className="h-8" />
      </>
    )
  }

  if (order.status === 'rejected') {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center" role="alert">
        <CircleX className="size-12 text-destructive" aria-hidden />
        <h1 className="text-xl font-bold">Pagamento recusado</h1>
        <p className="max-w-md text-sm text-subtle">{order.failureReason}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/cart">Voltar ao carrinho</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/checkout">Tentar novamente</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center gap-4 px-6 pt-10 pb-6 text-center">
        <ThankYouIcon />
        <h1 className="text-lg font-bold">Seus NFTs agora estão na sua carteira</h1>
      </div>
      <SummaryBand order={order} />
      <Items order={order} />
      <div className="flex flex-col items-center gap-5 px-6 pt-4 pb-10 text-center">
        <p className="max-w-md text-sm leading-6 text-subtle">
          Transação confirmada na {network}. A propriedade foi transferida para sua carteira conectada e registrada na rede.
        </p>
        {order.transaction ? (
          <Button asChild size="lg" className="font-bold">
            <a href={order.transaction.explorerUrl} target="_blank" rel="noopener noreferrer">
              Ver no {order.transaction.explorerName}
              <ExternalLink aria-hidden />
              <span className="sr-only"> (abre em nova aba; referência simulada)</span>
            </a>
          </Button>
        ) : null}
        <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
          Continuar explorando
        </Link>
      </div>
    </>
  )
}

export function OrderPage({ orderId }: { orderId: string }) {
  const { user } = useSession()
  const query = useQuery({ ...orderQueryOptions(user?.id ?? 'anonymous', orderId), enabled: Boolean(user) })
  const status = query.data?.status

  useEffect(() => {
    if (status && status !== 'pending') pendingOrder.clear(orderId)
  }, [status, orderId])

  if (query.isError && isApiError(query.error) && query.error.code === 'NOT_FOUND') {
    return <NotFoundPage title="Pedido não encontrado" description="Este pedido não existe ou pertence a outra conta." />
  }

  return (
    <div className="container-page flex justify-center py-8 md:py-14">
      <article
        aria-busy={query.isPending}
        className="w-full max-w-[41.25rem] overflow-hidden border-b-[6px] border-b-primary bg-surface"
      >
        {query.isPending ? (
          <div className="space-y-4 p-10" aria-label="Carregando pedido">
            <Skeleton className="mx-auto size-16 rounded-full bg-secondary" />
            <Skeleton className="mx-auto h-6 w-2/3 bg-secondary" />
            <Skeleton className="h-16 w-full bg-secondary" />
            <Skeleton className="h-40 w-full bg-secondary" />
          </div>
        ) : query.isError ? (
          <div className="p-6">
            <ErrorState title="Não foi possível carregar o pedido" error={query.error} onRetry={() => void query.refetch()} retrying={query.isFetching} />
          </div>
        ) : (
          <OrderCard order={query.data} />
        )}
      </article>
    </div>
  )
}
