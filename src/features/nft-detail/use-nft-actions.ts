import { useCallback } from 'react'
import { toast } from 'sonner'
import { useAuthPrompt } from '@/features/auth/auth-prompt'
import { useSession } from '@/features/auth/use-session'
import { notifyComingSoon } from '@/lib/coming-soon'

export type PurchaseIntent = {
  nftId: string
  editionId?: string
  quantity: number
}

export function useNftActions() {
  const { isAuthenticated } = useSession()
  const openAuth = useAuthPrompt()

  const toggleFavorite = useCallback(
    (nftId: string) => {
      void nftId
      if (!isAuthenticated) {
        toast.info('Faça login para adicionar este NFT aos seus favoritos.', { id: 'favorite-login' })
        openAuth('login')
        return
      }
      notifyComingSoon('Os favoritos')
    },
    [isAuthenticated, openAuth],
  )

  const addToCart = useCallback((intent: PurchaseIntent) => {
    void intent
    notifyComingSoon('O carrinho')
  }, [])

  const purchase = useCallback((intent: PurchaseIntent) => {
    void intent
    notifyComingSoon('A compra')
  }, [])

  return { toggleFavorite, addToCart, purchase }
}
