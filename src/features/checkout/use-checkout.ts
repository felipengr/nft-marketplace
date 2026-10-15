import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import type { Order, PlaceOrderInput } from '@/api/contracts/order'
import type { ConnectWalletInput } from '@/api/contracts/wallet'
import { placeOrder } from '@/api/orders'
import { connectWallet } from '@/api/wallets'
import { useSession } from '@/features/auth/use-session'
import { checkoutKeys, walletsQueryOptions } from '@/queries/checkout-queries'
import { idempotencyKeyFor, pendingOrder } from './order-attempts'

export function useWallets() {
  const { user } = useSession()
  return useQuery({ ...walletsQueryOptions(user?.id ?? 'anonymous'), enabled: Boolean(user) })
}

export function useConnectWallet() {
  return useMutation({ mutationFn: (input: ConnectWalletInput) => connectWallet(input) })
}

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const inFlight = useRef<Promise<Order> | null>(null)

  const mutation = useMutation({
    mutationKey: ['orders', 'place'],
    mutationFn: async (input: PlaceOrderInput) => {
      if (!user) throw new Error('Sessão ausente')
      return placeOrder(input, idempotencyKeyFor(user.id, input))
    },
    onSuccess: (order) => {
      if (!user) return
      queryClient.setQueryData(checkoutKeys.order(user.id, order.id), order)
      if (order.status === 'pending') pendingOrder.set({ userId: user.id, orderId: order.id })
    },
  })

  const submit = (input: PlaceOrderInput) => {
    if (inFlight.current) return inFlight.current
    const promise = mutation.mutateAsync(input).finally(() => {
      inFlight.current = null
    })
    inFlight.current = promise
    return promise
  }

  return { ...mutation, submit }
}
