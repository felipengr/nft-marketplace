import { request } from './http-client'
import { orderSchema, type PlaceOrderInput } from './contracts/order'

export const ORDER_REQUEST_TIMEOUT_MS = 8_000

export function placeOrder(input: PlaceOrderInput, idempotencyKey: string) {
  return request(orderSchema, {
    method: 'POST',
    url: '/orders',
    data: input,
    headers: { 'Idempotency-Key': idempotencyKey },
    timeout: ORDER_REQUEST_TIMEOUT_MS,
  })
}

export function fetchOrder(orderId: string, signal?: AbortSignal) {
  return request(orderSchema, { method: 'GET', url: `/orders/${encodeURIComponent(orderId)}`, signal })
}
