import { orderSchema, type Order, type PlaceOrderInput } from '@/api/contracts/order'
import { REALTIME_EVENTS, type OrderUpdatedEvent } from '@/api/contracts/realtime'
import { stableStringify } from '@/lib/stable-json'
import { buildQuote, editionOf, findNft, serializeCart, touch } from '../cart/cart-service'
import { db, type CartRecord, type MockDatabase, type OrderRecord } from '../db/database'
import { mockRuntime } from '../network/runtime'
import { realtimeHub } from '../realtime/hub'

const MAX_PER_ORDER = 10

const EXPLORERS = {
  ethereum: { name: 'Etherscan', url: 'https://etherscan.io/tx/' },
  polygon: { name: 'Polygonscan', url: 'https://polygonscan.com/tx/' },
} as const

const timers = new Map<string, number>()

function randomHex(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

export function stableHash(value: unknown): string {
  return stableStringify(value)
}

export function toOrder(record: OrderRecord): Order {
  return orderSchema.parse(record)
}

export function createPendingOrder(state: MockDatabase, cart: CartRecord, userId: string, input: PlaceOrderInput): OrderRecord {
  const quote = buildQuote(state, cart)
  const serialized = serializeCart(state, cart)
  const now = new Date()
  const { checkout } = mockRuntime.scenario()
  const record: OrderRecord = {
    id: `ord_${randomHex(12)}`,
    status: 'pending',
    version: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    items: serialized.items.map((line) => ({
      nftId: line.nftId,
      editionId: line.editionId,
      editionLabel: line.editionLabel,
      name: line.name,
      tokenId: line.tokenId,
      image: line.image,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    })),
    subtotal: quote.subtotal,
    discount: quote.discount,
    networkFee: quote.networkFee,
    total: quote.total,
    couponCode: quote.coupon?.code ?? null,
    wallet: { provider: input.provider, network: input.wallet.network, address: input.wallet.address },
    transaction: null,
    failureReason: null,
    userId,
    cartId: cart.id,
    settleAt: new Date(now.getTime() + checkout.settleMs).toISOString(),
    outcome: checkout.payment,
  }
  state.orders.push(record)
  return record
}

function confirm(state: MockDatabase, order: OrderRecord, now: Date): string[] {
  const changedNfts: string[] = []
  for (const item of order.items) {
    const record = findNft(state, item.nftId)
    const edition = record ? editionOf(record, item.editionId) : undefined
    if (!record || !edition) continue
    edition.available = Math.max(0, edition.available - item.quantity)
    edition.maxPerOrder = Math.min(edition.available, MAX_PER_ORDER)
    record.version += 1
    changedNfts.push(record.id)
  }
  const cart = state.carts.find((entry) => entry.id === order.cartId)
  if (cart) {
    for (const item of order.items) {
      const line = cart.items.find((entry) => entry.nftId === item.nftId && entry.editionId === item.editionId)
      if (line) line.quantity -= item.quantity
    }
    cart.items = cart.items.filter((entry) => entry.quantity > 0)
    if (order.couponCode && cart.couponCode === order.couponCode) cart.couponCode = null
    touch(cart)
  }
  const hash = `0x${randomHex(64)}`
  const explorer = EXPLORERS[order.wallet.network]
  order.status = 'confirmed'
  order.transaction = { hash, explorerUrl: `${explorer.url}${hash}`, explorerName: explorer.name, confirmedAt: now.toISOString() }
  return changedNfts
}

function reject(order: OrderRecord): void {
  order.status = 'rejected'
  order.failureReason = 'O pagamento foi recusado pela carteira. Nenhum valor foi cobrado e seus itens continuam no carrinho.'
}

function emitOrderUpdated(order: OrderRecord): void {
  const event: OrderUpdatedEvent = {
    eventId: `evt_${crypto.randomUUID()}`,
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: order.updatedAt,
    data: { userId: order.userId, status: order.status },
  }
  realtimeHub.sendToUser(order.userId, REALTIME_EVENTS.orderUpdated, event)
}

export function settleIfDue(orderId: string, now = new Date()): OrderRecord | undefined {
  const current = db.read().orders.find((order) => order.id === orderId)
  if (!current || current.status !== 'pending' || Date.parse(current.settleAt) > now.getTime()) return current
  const result = db.write((state) => {
    const order = state.orders.find((entry) => entry.id === orderId)
    if (!order || order.status !== 'pending') return { order, changedNfts: [] as string[] }
    const changedNfts = order.outcome === 'confirm' ? confirm(state, order, now) : (reject(order), [])
    order.version += 1
    order.updatedAt = now.toISOString()
    return { order: structuredClone(order), changedNfts, nfts: changedNfts.map((id) => structuredClone(findNft(state, id)!)) }
  })
  if (!result.order) return undefined
  emitOrderUpdated(result.order)
  for (const record of result.nfts ?? []) realtimeHub.emitNftUpdated(record)
  return result.order
}

export function scheduleSettlement(order: OrderRecord): void {
  const delay = Math.max(0, Date.parse(order.settleAt) - Date.now())
  window.clearTimeout(timers.get(order.id))
  timers.set(
    order.id,
    window.setTimeout(() => {
      timers.delete(order.id)
      settleIfDue(order.id)
    }, delay + 10),
  )
}

export function resumePendingSettlements(): void {
  for (const order of db.read().orders) {
    if (order.status === 'pending') scheduleSettlement(order)
  }
}
