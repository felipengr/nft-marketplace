import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { addCartItem, applyCoupon, removeCartItem, removeCoupon, updateCartItem } from '@/api/cart'
import { getErrorMessage } from '@/api/api-error'
import type { AddCartItemInput, Cart } from '@/api/contracts/cart'
import { useSession } from '@/features/auth/use-session'
import { cartKeys, cartQueryOptions, quoteQueryOptions, setCartIfNewer } from '@/queries/cart-queries'

export function useCartKey(): { base: QueryKey; ready: boolean } {
  const { user, isLoading } = useSession()
  const userId = user?.id ?? null
  const base = useMemo(() => cartKeys.base(userId), [userId])
  return { base, ready: !isLoading }
}

export function useCart() {
  const { base, ready } = useCartKey()
  return useQuery({ ...cartQueryOptions(base), enabled: ready })
}

export function useQuote(cart: Cart | undefined) {
  const { base, ready } = useCartKey()
  return useQuery(quoteQueryOptions(base, ready && Boolean(cart && cart.items.length > 0)))
}

function useCartMutationHelpers() {
  const queryClient = useQueryClient()
  const { base } = useCartKey()
  const applyCart = (cart: Cart) => {
    setCartIfNewer(queryClient, base, cart)
    void queryClient.invalidateQueries({ queryKey: cartKeys.quote(base) })
  }
  return { queryClient, base, applyCart }
}

export function useAddToCart() {
  const { applyCart } = useCartMutationHelpers()
  return useMutation({
    mutationFn: (input: AddCartItemInput) => addCartItem(input),
    onSuccess: applyCart,
  })
}

export function useUpdateCartItem() {
  const { queryClient, base, applyCart } = useCartMutationHelpers()
  return useMutation({
    mutationKey: ['cart', 'update-item'],
    mutationFn: ({ lineId, quantity }: { lineId: string; quantity: number }) => updateCartItem(lineId, quantity),
    onMutate: async ({ lineId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: base, exact: true })
      const previous = queryClient.getQueryData<Cart>(base)
      if (previous) {
        queryClient.setQueryData<Cart>(base, {
          ...previous,
          items: previous.items.map((line) => (line.id === lineId ? { ...line, quantity } : line)),
        })
      }
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(base, context.previous)
      toast.error(getErrorMessage(error))
      void queryClient.invalidateQueries({ queryKey: base })
    },
    onSuccess: applyCart,
  })
}

export function useRemoveCartItem() {
  const { applyCart } = useCartMutationHelpers()
  return useMutation({
    mutationFn: ({ lineId }: { lineId: string; name: string }) => removeCartItem(lineId),
    onSuccess: (cart, { name }) => {
      applyCart(cart)
      toast.success(`${name} removido do carrinho.`)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}

export function useApplyCoupon() {
  const { applyCart } = useCartMutationHelpers()
  return useMutation({
    mutationFn: (code: string) => applyCoupon({ code }),
    onSuccess: (cart) => {
      applyCart(cart)
      toast.success(`Cupom ${cart.couponCode} aplicado.`)
    },
  })
}

export function useRemoveCoupon() {
  const { applyCart } = useCartMutationHelpers()
  return useMutation({
    mutationFn: () => removeCoupon(),
    onSuccess: (cart) => {
      applyCart(cart)
      toast.success('Cupom removido.')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
