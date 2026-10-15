import { useIsMutating } from '@tanstack/react-query'
import { Link, useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/feedback/query-states'
import { Button } from '@/components/ui/button'
import { useAuthPrompt } from '@/features/auth/auth-prompt'
import { useSession } from '@/features/auth/use-session'
import { CATALOG_SECTION_ID } from '@/features/catalog/catalog-search'
import { RelatedNfts } from '@/features/nft-detail/related-nfts'
import { CART_GRID, CartLineItem, CartLineSkeleton } from './cart-line-item'
import { CartSummary } from './cart-summary'
import { useCart, useQuote, useRemoveCartItem, useUpdateCartItem } from './use-cart'

function MobileHeader() {
  const canGoBack = useCanGoBack()
  const router = useRouter()
  const navigate = useNavigate()
  return (
    <div className="relative mb-5 flex items-center justify-center md:hidden">
      <button
        type="button"
        onClick={() => (canGoBack ? router.history.back() : void navigate({ to: '/' }))}
        aria-label="Voltar"
        className="absolute left-0 flex size-10 items-center justify-center rounded-full border border-primary/40 text-subtle"
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <h1 className="text-lg font-bold tracking-wide">Carrinho de NFTs</h1>
    </div>
  )
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center rounded-sm bg-surface px-6 py-16 text-center">
      <ShoppingCart className="mb-4 size-10 text-primary" aria-hidden />
      <h2 className="mb-2 text-lg font-bold">Seu carrinho está vazio</h2>
      <p className="mb-6 max-w-sm text-sm text-subtle">Explore o catálogo e adicione NFTs para continuar.</p>
      <Button asChild>
        <Link to="/" hash={CATALOG_SECTION_ID}>
          Explorar NFTs
        </Link>
      </Button>
    </div>
  )
}

export function CartPage() {
  const cartQuery = useCart()
  const cart = cartQuery.data
  const quoteQuery = useQuote(cart)
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()
  const pendingUpdates = useIsMutating({ mutationKey: ['cart', 'update-item'] })
  const { isAuthenticated } = useSession()
  const openAuth = useAuthPrompt()
  const navigate = useNavigate()

  const checkout = () => {
    if (!isAuthenticated) {
      toast.info('Entre na sua conta para finalizar a compra. Seus itens continuam no carrinho.', { id: 'checkout-login' })
      openAuth('login', () => void navigate({ to: '/checkout' }), '/checkout')
      return
    }
    void navigate({ to: '/checkout' })
  }

  const issuesFor = (lineId: string) => quoteQuery.data?.issues.filter((issue) => issue.lineId === lineId) ?? []

  return (
    <>
    <div className="container-page pt-6 md:pt-8">
      <MobileHeader />
      <nav aria-label="Trilha de navegação" className="mb-4 hidden md:block">
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
          <li aria-current="page">Carrinho</li>
        </ol>
      </nav>
      <h1 className="sr-only max-md:hidden">Carrinho</h1>

      {cartQuery.isError && !cart ? (
        <ErrorState title="Não foi possível carregar o carrinho" error={cartQuery.error} onRetry={() => void cartQuery.refetch()} retrying={cartQuery.isFetching} />
      ) : cart && cart.items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_20.75rem] lg:gap-22">
          <section aria-label="Itens do carrinho">
            <div aria-hidden className={`mb-3 hidden border-b border-secondary pb-2 text-[0.95rem] font-bold ${CART_GRID}`}>
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
              <span />
            </div>
            <ul className="space-y-3">
              {cart
                ? cart.items.map((line) => (
                    <CartLineItem
                      key={line.id}
                      line={line}
                      issues={issuesFor(line.id)}
                      pending={pendingUpdates > 0 && updateItem.variables?.lineId === line.id}
                      onQuantityChange={(quantity) => updateItem.mutate({ lineId: line.id, quantity })}
                      onRemove={() => removeItem.mutate({ lineId: line.id, name: line.name })}
                    />
                  ))
                : Array.from({ length: 3 }, (_, index) => <CartLineSkeleton key={index} />)}
            </ul>
          </section>

          {cart ? (
            <CartSummary
              cart={cart}
              quote={quoteQuery.data}
              quoteError={quoteQuery.error}
              quoteLoading={quoteQuery.isPending}
              quoteRefreshing={quoteQuery.isFetching}
              onRetryQuote={() => void quoteQuery.refetch()}
              onCheckout={checkout}
              className="sticky bottom-0 z-10 -mx-4 rounded-t-3xl border-t border-secondary bg-surface px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:static md:mx-0 md:rounded-none md:border-0 md:bg-transparent md:p-0 lg:self-start"
            />
          ) : (
            <div className="space-y-3" aria-hidden>
              <CartLineSkeleton />
            </div>
          )}
        </div>
      )}

    </div>
    {cart && cart.items.length > 0 ? <RelatedNfts nftId={cart.items[0].nftId} title="Colecionadores também viram" /> : null}
    </>
  )
}
