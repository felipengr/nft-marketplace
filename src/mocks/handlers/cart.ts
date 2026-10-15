import { HttpResponse, http } from 'msw'
import {
  addCartItemInputSchema,
  applyCouponInputSchema,
  mergeCartInputSchema,
  updateCartItemInputSchema,
} from '@/api/contracts/cart'
import { addEth } from '@/lib/money'
import { authenticate, readBearerToken } from '../auth/sessions'
import {
  addItem,
  buildQuote,
  checkCoupon,
  defaultEditionId,
  editionOf,
  ensureCart,
  findCart,
  findNft,
  lineMaxQuantity,
  serializeCart,
  touch,
} from '../cart/cart-service'
import { db } from '../db/database'
import { apiError, readJson, validationError } from '../network/responses'
import { withNetwork } from '../network/simulate'

const GUEST_ID_PATTERN = /^guest_[a-f0-9]{32}$/

type CartOwner = { ownerId: string } | { guestId: string }

function resolveOwner(request: Request): CartOwner | ReturnType<typeof apiError> {
  if (readBearerToken(request)) {
    const auth = authenticate(request)
    if (auth instanceof Response) return auth
    return { ownerId: auth.user.id }
  }
  const guestId = request.headers.get('X-Cart-Id')
  if (!guestId || !GUEST_ID_PATTERN.test(guestId)) {
    return apiError(400, 'VALIDATION_ERROR', 'Identificador de carrinho inválido.')
  }
  return { guestId }
}

function stockConflict(available: number) {
  if (available <= 0) return apiError(409, 'CONFLICT', 'Esta edição esgotou.')
  return apiError(409, 'CONFLICT', `Quantidade indisponível. Máximo de ${available} por pedido nesta edição.`)
}

export const cartHandlers = [
  http.get(
    '/api/cart',
    withNetwork(({ request }) => {
      const owner = resolveOwner(request)
      if (owner instanceof Response) return owner
      const state = db.read()
      const cart = findCart(state, owner)
      if (cart) return HttpResponse.json(serializeCart(state, cart))
      return HttpResponse.json(db.write((draft) => serializeCart(draft, ensureCart(draft, owner))))
    }),
  ),

  http.get(
    '/api/cart/quote',
    withNetwork(({ request }) => {
      const owner = resolveOwner(request)
      if (owner instanceof Response) return owner
      return HttpResponse.json(db.write((draft) => buildQuote(draft, ensureCart(draft, owner))))
    }),
  ),

  http.post(
    '/api/cart/items',
    withNetwork(async ({ request }) => {
      const owner = resolveOwner(request)
      if (owner instanceof Response) return owner
      const parsed = addCartItemInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      const { nftId, quantity } = parsed.data
      const state = db.read()
      const record = findNft(state, nftId)
      if (!record) return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
      const editionId = parsed.data.editionId ?? defaultEditionId(record)
      const edition = editionId ? editionOf(record, editionId) : undefined
      if (!editionId || !edition) {
        return edition === undefined && parsed.data.editionId
          ? apiError(404, 'NOT_FOUND', 'Edição não encontrada.')
          : stockConflict(0)
      }
      const current = findCart(state, owner)?.items.find((item) => item.nftId === nftId && item.editionId === editionId)?.quantity ?? 0
      if (current + quantity > edition.maxPerOrder) return stockConflict(edition.maxPerOrder - current)
      return HttpResponse.json(
        db.write((draft) => {
          const cart = ensureCart(draft, owner)
          addItem(cart, findNft(draft, nftId)!, editionId, quantity)
          touch(cart)
          return serializeCart(draft, cart)
        }),
        { status: 201 },
      )
    }),
  ),

  http.patch<{ lineId: string }>(
    '/api/cart/items/:lineId',
    withNetwork(async ({ request, params }) => {
      const owner = resolveOwner(request)
      if (owner instanceof Response) return owner
      const parsed = updateCartItemInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      const state = db.read()
      const item = findCart(state, owner)?.items.find((line) => line.lineId === params.lineId)
      if (!item) return apiError(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
      const record = findNft(state, item.nftId)
      const max = record ? lineMaxQuantity(record, item.editionId) : 0
      if (parsed.data.quantity > max) return stockConflict(max)
      return HttpResponse.json(
        db.write((draft) => {
          const cart = ensureCart(draft, owner)
          const line = cart.items.find((entry) => entry.lineId === params.lineId)!
          line.quantity = parsed.data.quantity
          touch(cart)
          return serializeCart(draft, cart)
        }),
      )
    }),
  ),

  http.delete<{ lineId: string }>(
    '/api/cart/items/:lineId',
    withNetwork(({ request, params }) => {
      const owner = resolveOwner(request)
      if (owner instanceof Response) return owner
      const exists = findCart(db.read(), owner)?.items.some((line) => line.lineId === params.lineId)
      if (!exists) return apiError(404, 'NOT_FOUND', 'Item não encontrado no carrinho.')
      return HttpResponse.json(
        db.write((draft) => {
          const cart = ensureCart(draft, owner)
          cart.items = cart.items.filter((line) => line.lineId !== params.lineId)
          if (cart.items.length === 0) cart.couponCode = null
          touch(cart)
          return serializeCart(draft, cart)
        }),
      )
    }),
  ),

  http.put(
    '/api/cart/coupon',
    withNetwork(async ({ request }) => {
      const owner = resolveOwner(request)
      if (owner instanceof Response) return owner
      const parsed = applyCouponInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      const state = db.read()
      const cart = findCart(state, owner)
      const subtotal = cart ? addEth(...serializeCart(state, cart).items.map((line) => line.lineTotal)) : '0'
      if (!cart || cart.items.length === 0) {
        return apiError(422, 'VALIDATION_ERROR', 'Adicione NFTs ao carrinho antes de aplicar um cupom.', {
          code: 'Adicione NFTs ao carrinho antes de aplicar um cupom.',
        })
      }
      const check = checkCoupon(parsed.data.code, subtotal)
      if (!check.ok) return apiError(422, 'VALIDATION_ERROR', check.message, { code: check.message })
      return HttpResponse.json(
        db.write((draft) => {
          const target = ensureCart(draft, owner)
          target.couponCode = check.coupon.code
          touch(target)
          return serializeCart(draft, target)
        }),
      )
    }),
  ),

  http.delete(
    '/api/cart/coupon',
    withNetwork(({ request }) => {
      const owner = resolveOwner(request)
      if (owner instanceof Response) return owner
      return HttpResponse.json(
        db.write((draft) => {
          const cart = ensureCart(draft, owner)
          cart.couponCode = null
          touch(cart)
          return serializeCart(draft, cart)
        }),
      )
    }),
  ),

  http.post(
    '/api/cart/merge',
    withNetwork(async ({ request }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const parsed = mergeCartInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      return HttpResponse.json(
        db.write((draft) => {
          const target = ensureCart(draft, { ownerId: auth.user.id })
          const guest = findCart(draft, { guestId: parsed.data.guestCartId })
          if (guest) {
            for (const item of guest.items) {
              const record = findNft(draft, item.nftId)
              if (!record) continue
              const existing = target.items.find((line) => line.nftId === item.nftId && line.editionId === item.editionId)?.quantity ?? 0
              const allowed = Math.min(item.quantity, lineMaxQuantity(record, item.editionId) - existing)
              if (allowed > 0) addItem(target, record, item.editionId, allowed)
            }
            if (!target.couponCode && guest.couponCode) target.couponCode = guest.couponCode
            draft.carts = draft.carts.filter((cart) => cart !== guest)
            touch(target)
          }
          return serializeCart(draft, target)
        }),
      )
    }),
  ),
]
