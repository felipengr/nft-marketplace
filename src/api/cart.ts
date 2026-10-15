import { request } from './http-client'
import { cartSchema, quoteSchema, type AddCartItemInput, type ApplyCouponInput } from './contracts/cart'

export function fetchCart(signal?: AbortSignal) {
  return request(cartSchema, { method: 'GET', url: '/cart', signal })
}

export function fetchQuote(signal?: AbortSignal) {
  return request(quoteSchema, { method: 'GET', url: '/cart/quote', signal })
}

export function addCartItem(input: AddCartItemInput) {
  return request(cartSchema, { method: 'POST', url: '/cart/items', data: input })
}

export function updateCartItem(lineId: string, quantity: number) {
  return request(cartSchema, { method: 'PATCH', url: `/cart/items/${encodeURIComponent(lineId)}`, data: { quantity } })
}

export function removeCartItem(lineId: string) {
  return request(cartSchema, { method: 'DELETE', url: `/cart/items/${encodeURIComponent(lineId)}` })
}

export function applyCoupon(input: ApplyCouponInput) {
  return request(cartSchema, { method: 'PUT', url: '/cart/coupon', data: input })
}

export function removeCoupon() {
  return request(cartSchema, { method: 'DELETE', url: '/cart/coupon' })
}

export function mergeGuestCart(guestCartId: string) {
  return request(cartSchema, { method: 'POST', url: '/cart/merge', data: { guestCartId } })
}

export function acknowledgeCartChanges() {
  return request(cartSchema, { method: 'POST', url: '/cart/acknowledge' })
}
