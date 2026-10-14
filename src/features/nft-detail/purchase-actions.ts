import { notifyComingSoon } from '@/lib/coming-soon'

export type PurchaseIntent = {
  nftId: string
  editionId?: string
  quantity: number
}

export function requestPurchase(intent: PurchaseIntent): void {
  void intent
  notifyComingSoon('A compra')
}

export function requestAddToCart(intent: PurchaseIntent): void {
  void intent
  notifyComingSoon('O carrinho')
}

export function requestToggleFavorite(nftId: string): void {
  void nftId
  notifyComingSoon('Os favoritos')
}
