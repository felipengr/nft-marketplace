import { keepPreviousData, queryOptions, type QueryClient, type QueryKey } from '@tanstack/react-query'
import { fetchCart, fetchQuote } from '@/api/cart'
import { guestCartId } from '@/api/cart-identity'
import type { Cart } from '@/api/contracts/cart'
import { privateKeys } from './session-queries'

export const cartKeys = {
  guestAll: ['cart', 'guest'] as const,
  base: (userId: string | null): QueryKey => (userId ? [...privateKeys.user(userId), 'cart'] : [...cartKeys.guestAll, guestCartId.get()]),
  quote: (base: QueryKey): QueryKey => [...base, 'quote'],
}

export function cartQueryOptions(base: QueryKey) {
  return queryOptions({
    queryKey: base,
    queryFn: ({ signal }) => fetchCart(signal),
    staleTime: 15_000,
  })
}

export function quoteQueryOptions(base: QueryKey, enabled: boolean) {
  return queryOptions({
    queryKey: cartKeys.quote(base),
    queryFn: ({ signal }) => fetchQuote(signal),
    enabled,
    staleTime: 0,
    placeholderData: keepPreviousData,
  })
}

export function setCartIfNewer(queryClient: QueryClient, base: QueryKey, next: Cart): boolean {
  const current = queryClient.getQueryData<Cart>(base)
  if (current && current.id === next.id && current.version > next.version) return false
  queryClient.setQueryData(base, next)
  return true
}
