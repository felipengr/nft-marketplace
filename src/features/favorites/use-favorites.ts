import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/api-error'
import type { FavoritesResponse } from '@/api/contracts/favorites'
import type { NftSummary } from '@/api/contracts/nft'
import { addFavorite, fetchFavorites, removeFavorite } from '@/api/favorites'
import { useSession } from '@/features/auth/use-session'
import { privateKeys } from '@/queries/session-queries'

const TOGGLE_KEY = ['favorites', 'toggle'] as const

export function favoritesKey(userId: string) {
  return [...privateKeys.user(userId), 'favorites'] as const
}

export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: favoritesKey(userId),
    queryFn: ({ signal }) => fetchFavorites(signal),
    staleTime: 60_000,
  })
}

export function useFavorites() {
  const { user } = useSession()
  const query = useQuery({ ...favoritesQueryOptions(user?.id ?? 'anonymous'), enabled: Boolean(user) })
  const ids = useMemo(() => new Set(query.data?.items.map((item) => item.id) ?? []), [query.data])
  return { ...query, ids }
}

type ToggleVariables = { nft: NftSummary; favorite: boolean }

function toSummary(nft: NftSummary): NftSummary {
  const { id, name, tokenId, price, previousPrice, image, network, category, badge, available, listedAt, version } = nft
  return { id, name, tokenId, price, previousPrice, image, network, category, badge, available, listedAt, version }
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const key = favoritesKey(user?.id ?? 'anonymous')

  return useMutation({
    mutationKey: TOGGLE_KEY,
    mutationFn: ({ nft, favorite }: ToggleVariables) => (favorite ? addFavorite(nft.id) : removeFavorite(nft.id)),
    onMutate: async ({ nft, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<FavoritesResponse>(key)
      const others = (previous?.items ?? []).filter((item) => item.id !== nft.id)
      queryClient.setQueryData<FavoritesResponse>(key, { items: favorite ? [toSummary(nft), ...others] : others })
      return { previous }
    },
    onError: (error, { nft, favorite }, context) => {
      queryClient.setQueryData(key, context?.previous)
      const action = favorite ? `favoritar ${nft.name}` : `remover ${nft.name} dos favoritos`
      toast.error(`Não foi possível ${action}. ${getErrorMessage(error)}`)
    },
    onSuccess: (_data, { nft, favorite }) => {
      toast.success(favorite ? `${nft.name} adicionado aos favoritos.` : `${nft.name} removido dos favoritos.`, {
        id: `favorite-${nft.id}`,
      })
    },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: TOGGLE_KEY }) <= 1) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })
}
