import type { Cart, CartLine, Quote, QuoteIssue } from '@/api/contracts/cart'
import { addEth, compareEth, formatEth, multiplyEth, percentOfEth, subtractEth } from '@/lib/money'
import { buildArtworkImage } from '../fixtures/artworks'
import { COUPONS, NETWORK_FEE, type CouponRecord } from '../fixtures/coupons'
import type { NftRecord } from '../fixtures/nfts'
import type { CartItemRecord, CartRecord, MockDatabase } from '../db/database'

const QUOTE_TTL_MS = 5 * 60 * 1000

export type CouponCheck = { ok: true; coupon: CouponRecord } | { ok: false; message: string }

export function findNft(state: MockDatabase, nftId: string): NftRecord | undefined {
  return state.nfts.find((record) => record.id === nftId)
}

export function editionOf(record: NftRecord, editionId: string) {
  return record.editions.find((edition) => edition.id === editionId)
}

export function lineMaxQuantity(record: NftRecord, editionId: string): number {
  return editionOf(record, editionId)?.maxPerOrder ?? 0
}

export function defaultEditionId(record: NftRecord): string | undefined {
  const available = record.editions.filter((edition) => edition.available > 0)
  const limited = available.filter((edition) => edition.supply !== null).sort((a, b) => (b.supply ?? 0) - (a.supply ?? 0))
  return (limited[0] ?? available[0])?.id
}

export function findCart(state: MockDatabase, query: { ownerId: string } | { guestId: string }): CartRecord | undefined {
  if ('ownerId' in query) return state.carts.find((cart) => cart.ownerId === query.ownerId)
  return state.carts.find((cart) => cart.ownerId === null && cart.id === query.guestId)
}

export function ensureCart(state: MockDatabase, query: { ownerId: string } | { guestId: string }): CartRecord {
  const existing = findCart(state, query)
  if (existing) return existing
  const cart: CartRecord = {
    id: 'ownerId' in query ? `cart_${query.ownerId}` : query.guestId,
    ownerId: 'ownerId' in query ? query.ownerId : null,
    items: [],
    couponCode: null,
    version: 0,
    updatedAt: new Date().toISOString(),
  }
  state.carts.push(cart)
  return cart
}

export function touch(cart: CartRecord): void {
  cart.version += 1
  cart.updatedAt = new Date().toISOString()
}

export function addItem(cart: CartRecord, record: NftRecord, editionId: string, quantity: number): void {
  const existing = cart.items.find((item) => item.nftId === record.id && item.editionId === editionId)
  if (existing) {
    existing.quantity += quantity
    return
  }
  const item: CartItemRecord = {
    lineId: `line_${crypto.randomUUID().slice(0, 12)}`,
    nftId: record.id,
    editionId,
    quantity,
    priceSnapshot: record.price,
  }
  cart.items.push(item)
}

export function checkCoupon(code: string, subtotal: string, now = Date.now()): CouponCheck {
  const coupon = COUPONS.find((item) => item.code === code.trim().toUpperCase())
  if (!coupon) return { ok: false, message: 'Cupom inválido. Confira o código e tente novamente.' }
  if (Date.parse(coupon.expiresAt) <= now) return { ok: false, message: 'Este cupom expirou.' }
  if (coupon.minSubtotal && compareEth(subtotal, coupon.minSubtotal) < 0) {
    return { ok: false, message: `Este cupom exige subtotal mínimo de ${formatEth(coupon.minSubtotal)}.` }
  }
  return { ok: true, coupon }
}

function couponDiscount(coupon: CouponRecord, subtotal: string): string {
  const raw = coupon.kind === 'percent' ? percentOfEth(subtotal, coupon.value) : coupon.value
  return compareEth(raw, subtotal) > 0 ? subtotal : raw
}

function serializeLine(state: MockDatabase, item: CartItemRecord): CartLine | null {
  const record = findNft(state, item.nftId)
  const edition = record ? editionOf(record, item.editionId) : undefined
  if (!record || !edition) return null
  return {
    id: item.lineId,
    nftId: record.id,
    editionId: edition.id,
    editionLabel: edition.label,
    name: record.name,
    tokenId: record.tokenId,
    image: buildArtworkImage(record.artwork, record.name),
    unitPrice: record.price,
    quantity: item.quantity,
    maxQuantity: edition.maxPerOrder,
    lineTotal: multiplyEth(record.price, item.quantity),
  }
}

export function serializeCart(state: MockDatabase, cart: CartRecord): Cart {
  const items = cart.items.map((item) => serializeLine(state, item)).filter((line) => line !== null)
  return {
    id: cart.id,
    items,
    itemCount: items.reduce((total, line) => total + line.quantity, 0),
    couponCode: cart.couponCode,
    version: cart.version,
  }
}

export function buildQuote(state: MockDatabase, cart: CartRecord, now = Date.now()): Quote {
  const serialized = serializeCart(state, cart)
  const issues: QuoteIssue[] = []
  for (const item of cart.items) {
    const record = findNft(state, item.nftId)
    const edition = record ? editionOf(record, item.editionId) : undefined
    if (!record || !edition) continue
    if (edition.available === 0) {
      issues.push({ lineId: item.lineId, kind: 'sold-out', message: `${record.name} (${edition.label}) esgotou.` })
    } else if (item.quantity > edition.maxPerOrder) {
      issues.push({
        lineId: item.lineId,
        kind: 'insufficient-stock',
        message: `${record.name} (${edition.label}): máximo de ${edition.maxPerOrder} por pedido no momento.`,
      })
    }
    if (compareEth(record.price, item.priceSnapshot) !== 0) {
      issues.push({
        lineId: item.lineId,
        kind: 'price-changed',
        message: `${record.name} mudou de ${formatEth(item.priceSnapshot)} para ${formatEth(record.price)}.`,
      })
    }
  }

  const subtotal = addEth(...serialized.items.map((line) => line.lineTotal))
  let discount = '0'
  let coupon: Quote['coupon'] = null
  if (cart.couponCode) {
    const check = checkCoupon(cart.couponCode, subtotal, now)
    if (check.ok) {
      discount = couponDiscount(check.coupon, subtotal)
      coupon = { code: check.coupon.code, description: check.coupon.description }
    } else {
      issues.push({ lineId: null, kind: 'coupon-not-applicable', message: `Cupom ${cart.couponCode}: ${check.message}` })
    }
  }
  const networkFee = serialized.items.length ? NETWORK_FEE : '0'
  return {
    cartVersion: cart.version,
    subtotal,
    discount,
    discountLabel: 'Desconto do lançamento',
    networkFee,
    networkFeeLabel: 'Taxa estimada',
    total: addEth(subtractEth(subtotal, discount), networkFee),
    coupon,
    issues,
    expiresAt: new Date(now + QUOTE_TTL_MS).toISOString(),
  }
}
