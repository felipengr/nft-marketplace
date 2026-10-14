import { request } from './http-client'
import { serializeCatalogParams } from './contracts/catalog-query'
import {
  catalogResponseSchema,
  featuredResponseSchema,
  nftDetailSchema,
  relatedResponseSchema,
  type CatalogParamsInput,
} from './contracts/nft'

export function fetchCatalog(params: CatalogParamsInput, signal?: AbortSignal) {
  return request(catalogResponseSchema, {
    method: 'GET',
    url: '/nfts',
    params: serializeCatalogParams(params),
    signal,
  })
}

export function fetchFeatured(signal?: AbortSignal) {
  return request(featuredResponseSchema, { method: 'GET', url: '/nfts/featured', signal })
}

export function fetchNft(nftId: string, signal?: AbortSignal) {
  return request(nftDetailSchema, { method: 'GET', url: `/nfts/${encodeURIComponent(nftId)}`, signal })
}

export function fetchRelatedNfts(nftId: string, signal?: AbortSignal) {
  return request(relatedResponseSchema, {
    method: 'GET',
    url: `/nfts/${encodeURIComponent(nftId)}/related`,
    signal,
  })
}
