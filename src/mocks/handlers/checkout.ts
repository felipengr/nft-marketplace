import { HttpResponse, delay, http } from 'msw'
import { placeOrderInputSchema } from '@/api/contracts/order'
import { connectWalletInputSchema, walletSchema, type WalletConnection } from '@/api/contracts/wallet'
import { addEth, compareEth } from '@/lib/money'
import { authenticate } from '../auth/sessions'
import { buildQuote, ensureCart } from '../cart/cart-service'
import { db } from '../db/database'
import { apiError, readJson, validationError } from '../network/responses'
import { mockRuntime } from '../network/runtime'
import { withNetwork } from '../network/simulate'
import { createPendingOrder, scheduleSettlement, settleIfDue, stableHash, toOrder } from '../orders/order-service'
import { sellOut, updateNft } from '../realtime/market'

const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9_-]{16,80}$/

const TIMEOUT_HOLD_MS = 15_000

function quoteChanged(message: string) {
  return apiError(409, 'CONFLICT', message, { reason: 'quote-changed' })
}

export const checkoutHandlers = [
  http.get(
    '/api/wallets',
    withNetwork(({ request }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const items = db
        .read()
        .wallets.filter((wallet) => wallet.userId === auth.user.id)
        .map((wallet) => walletSchema.parse(wallet))
      return HttpResponse.json({ items })
    }),
  ),

  http.post(
    '/api/wallet-connections',
    withNetwork(async ({ request }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const parsed = connectWalletInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      await delay(400)
      if (mockRuntime.scenario().checkout.walletConnection === 'reject') {
        return apiError(403, 'FORBIDDEN', 'A conexão foi recusada na carteira. Aprove o pedido de conexão para continuar.')
      }
      const body: WalletConnection = { connectionId: `conn_${crypto.randomUUID().slice(0, 12)}`, ...parsed.data }
      return HttpResponse.json(body)
    }),
  ),

  http.post(
    '/api/orders',
    withNetwork(async ({ request }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const key = request.headers.get('Idempotency-Key')
      if (!key || !IDEMPOTENCY_PATTERN.test(key)) {
        return apiError(400, 'VALIDATION_ERROR', 'Cabeçalho Idempotency-Key ausente ou inválido.')
      }
      const parsed = placeOrderInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      const input = parsed.data
      const requestHash = stableHash(input)

      const previous = db.read().idempotency.find((entry) => entry.userId === auth.user.id && entry.key === key)
      if (previous) {
        if (previous.requestHash !== requestHash) {
          return apiError(409, 'CONFLICT', 'Esta tentativa de compra já foi usada com dados diferentes. Revise e confirme novamente.', {
            reason: 'idempotency-conflict',
          })
        }
        const existing = settleIfDue(previous.orderId)
        return existing ? HttpResponse.json(toOrder(existing)) : apiError(404, 'NOT_FOUND', 'Pedido não encontrado.')
      }

      const { checkout } = mockRuntime.scenario()
      const firstItem = db.read().carts.find((cart) => cart.ownerId === auth.user.id)?.items[0]
      if (firstItem && checkout.priceChangeOnSubmit && mockRuntime.consumeOnce('checkout-price-change')) {
        const record = db.read().nfts.find((nft) => nft.id === firstItem.nftId)
        if (record) updateNft(record.id, { price: addEth(record.price, '0.05') })
      }
      if (firstItem && checkout.sellOutOnSubmit && mockRuntime.consumeOnce('checkout-sold-out')) {
        sellOut(firstItem.nftId, firstItem.editionId)
      }

      const state = db.read()
      const cart = state.carts.find((entry) => entry.ownerId === auth.user.id)
      if (!cart || cart.items.length === 0) return apiError(422, 'VALIDATION_ERROR', 'Seu carrinho está vazio.')
      const quote = buildQuote(state, cart)
      const blocking = quote.issues.filter((issue) => issue.lineId !== null)
      if (blocking.length) return quoteChanged(blocking.map((issue) => issue.message).join(' '))
      if (cart.version !== input.expected.cartVersion || compareEth(quote.total, input.expected.total) !== 0) {
        return quoteChanged('Os valores do pedido mudaram desde a sua revisão. Confira o novo total e confirme novamente.')
      }

      const order = db.write((draft) => {
        const target = ensureCart(draft, { ownerId: auth.user.id })
        const created = createPendingOrder(draft, target, auth.user.id, input)
        draft.idempotency.push({ key, userId: auth.user.id, requestHash, orderId: created.id })
        return structuredClone(created)
      })
      scheduleSettlement(order)

      if (checkout.timeoutAfterCreate && mockRuntime.consumeOnce('order-timeout')) {
        await delay(TIMEOUT_HOLD_MS)
      }
      return HttpResponse.json(toOrder(order), { status: 201 })
    }),
  ),

  http.get<{ orderId: string }>(
    '/api/orders/:orderId',
    withNetwork(({ request, params }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const order = settleIfDue(params.orderId)
      if (!order || order.userId !== auth.user.id) return apiError(404, 'NOT_FOUND', 'Pedido não encontrado.')
      return HttpResponse.json(toOrder(order))
    }),
  ),
]
