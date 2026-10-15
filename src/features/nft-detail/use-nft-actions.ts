import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/api-error'
import type { NftSummary } from '@/api/contracts/nft'
import { useAuthPrompt } from '@/features/auth/auth-prompt'
import { useSession } from '@/features/auth/use-session'
import { useAddToCart } from '@/features/cart/use-cart'
import { favoritesQueryOptions, useFavorites, useToggleFavorite } from '@/features/favorites/use-favorites'
import { sessionQueryOptions } from '@/queries/session-queries'

export type PurchaseIntent = {
  nft: Pick<NftSummary, 'id' | 'name'>
  editionId?: string
  quantity: number
}

export function useNftActions() {
  const { isAuthenticated, isLoading, user } = useSession()
  const queryClient = useQueryClient()
  const openAuth = useAuthPrompt()
  const navigate = useNavigate()
  const favorites = useFavorites()
  const toggleMutation = useToggleFavorite()
  const addMutation = useAddToCart()

  const isFavorite = useCallback((nftId: string) => favorites.ids.has(nftId), [favorites.ids])

  const toggleFavorite = useCallback(
    async (nft: NftSummary) => {
      const session = isLoading ? await queryClient.ensureQueryData(sessionQueryOptions()).catch(() => null) : isAuthenticated ? true : null
      if (!session) {
        toast.info('Faça login para adicionar este NFT aos seus favoritos.', { id: 'favorite-login' })
        openAuth('login')
        return
      }
      const userId = user?.id ?? (typeof session === 'object' ? session.user.id : null)
      if (!userId) return
      const current = favorites.data ?? (await queryClient.ensureQueryData(favoritesQueryOptions(userId)).catch(() => undefined))
      const already = current?.items.some((item) => item.id === nft.id) ?? false
      toggleMutation.mutate({ nft, favorite: !already })
    },
    [isLoading, isAuthenticated, user, queryClient, openAuth, toggleMutation, favorites.data],
  )

  const addToCart = useCallback(
    (intent: PurchaseIntent, options: { goToCart?: boolean } = {}) => {
      addMutation.mutate(
        { nftId: intent.nft.id, editionId: intent.editionId, quantity: intent.quantity },
        {
          onSuccess: () => {
            if (options.goToCart) {
              void navigate({ to: '/cart' })
              return
            }
            toast.success(`${intent.nft.name} adicionado ao carrinho.`, {
              id: `cart-add-${intent.nft.id}`,
              action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/cart' }) },
            })
          },
          onError: (error) => toast.error(getErrorMessage(error), { id: `cart-add-error-${intent.nft.id}` }),
        },
      )
    },
    [addMutation, navigate],
  )

  const purchase = useCallback((intent: PurchaseIntent) => addToCart(intent, { goToCart: true }), [addToCart])

  return { isFavorite, toggleFavorite, addToCart, purchase, isAdding: addMutation.isPending }
}
