import { queryOptions } from '@tanstack/react-query'
import { fetchOrder } from '@/api/orders'
import { fetchWallets } from '@/api/wallets'
import { privateKeys } from './session-queries'

const PENDING_POLL_MS = 4_000

export const checkoutKeys = {
  wallets: (userId: string) => [...privateKeys.user(userId), 'wallets'] as const,
  orders: (userId: string) => [...privateKeys.user(userId), 'orders'] as const,
  order: (userId: string, orderId: string) => [...checkoutKeys.orders(userId), orderId] as const,
}

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: checkoutKeys.wallets(userId),
    queryFn: ({ signal }) => fetchWallets(signal),
    staleTime: 60_000,
  })
}

export function orderQueryOptions(userId: string, orderId: string) {
  return queryOptions({
    queryKey: checkoutKeys.order(userId, orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? PENDING_POLL_MS : false),
  })
}
