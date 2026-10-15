import { request, requestVoid } from './http-client'
import { favoritesResponseSchema } from './contracts/favorites'

export function fetchFavorites(signal?: AbortSignal) {
  return request(favoritesResponseSchema, { method: 'GET', url: '/favorites', signal })
}

export function addFavorite(nftId: string) {
  return requestVoid({ method: 'PUT', url: `/favorites/${encodeURIComponent(nftId)}` })
}

export function removeFavorite(nftId: string) {
  return requestVoid({ method: 'DELETE', url: `/favorites/${encodeURIComponent(nftId)}` })
}
