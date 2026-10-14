import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { catalogParamsSchema, type CatalogParamsInput } from '@/api/contracts/nft'
import { fetchCatalog, fetchFeatured, fetchNft, fetchRelatedNfts } from '@/api/nfts'

export const nftKeys = {
  all: ['nfts'] as const,
  catalogs: () => [...nftKeys.all, 'catalog'] as const,
  catalog: (params: CatalogParamsInput) => [...nftKeys.catalogs(), catalogParamsSchema.parse(params)] as const,
  featured: () => [...nftKeys.all, 'featured'] as const,
  details: () => [...nftKeys.all, 'detail'] as const,
  detail: (nftId: string) => [...nftKeys.details(), nftId] as const,
  related: (nftId: string) => [...nftKeys.all, 'related', nftId] as const,
}

export function catalogQueryOptions(params: CatalogParamsInput) {
  return queryOptions({
    queryKey: nftKeys.catalog(params),
    queryFn: ({ signal }) => fetchCatalog(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function featuredQueryOptions() {
  return queryOptions({
    queryKey: nftKeys.featured(),
    queryFn: ({ signal }) => fetchFeatured(signal),
    staleTime: 5 * 60_000,
  })
}

export function nftQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: nftKeys.detail(nftId),
    queryFn: ({ signal }) => fetchNft(nftId, signal),
  })
}

export function relatedNftsQueryOptions(nftId: string) {
  return queryOptions({
    queryKey: nftKeys.related(nftId),
    queryFn: ({ signal }) => fetchRelatedNfts(nftId, signal),
    staleTime: 5 * 60_000,
  })
}
