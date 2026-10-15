import { HttpResponse, http } from 'msw'
import type { FavoritesResponse } from '@/api/contracts/favorites'
import { authenticate } from '../auth/sessions'
import { db } from '../db/database'
import { apiError } from '../network/responses'
import { withNetwork } from '../network/simulate'
import { toNftSummary } from '../serializers'

export const favoritesHandlers = [
  http.get(
    '/api/favorites',
    withNetwork(({ request }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const state = db.read()
      const ids = state.favorites[auth.user.id] ?? []
      const body: FavoritesResponse = {
        items: ids
          .map((id) => state.nfts.find((record) => record.id === id))
          .filter((record) => record !== undefined)
          .map(toNftSummary),
      }
      return HttpResponse.json(body)
    }),
  ),

  http.put<{ nftId: string }>(
    '/api/favorites/:nftId',
    withNetwork(({ request, params }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      if (!db.read().nfts.some((record) => record.id === params.nftId)) return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
      db.write((draft) => {
        const current = draft.favorites[auth.user.id] ?? []
        if (!current.includes(params.nftId)) draft.favorites[auth.user.id] = [params.nftId, ...current]
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.delete<{ nftId: string }>(
    '/api/favorites/:nftId',
    withNetwork(({ request, params }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      db.write((draft) => {
        draft.favorites[auth.user.id] = (draft.favorites[auth.user.id] ?? []).filter((id) => id !== params.nftId)
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
