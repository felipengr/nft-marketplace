import { HttpResponse, http } from 'msw'
import { parseCatalogParams } from '@/api/contracts/catalog-query'
import type { CatalogResponse, FeaturedResponse, RelatedResponse } from '@/api/contracts/nft'
import { db } from '../db/database'
import { FEATURED_FIXTURE } from '../fixtures/featured'
import type { NftRecord } from '../fixtures/nfts'
import { notFound, validationError } from '../network/responses'
import { mockRuntime } from '../network/runtime'
import { withNetwork } from '../network/simulate'
import { toNftDetail, toNftSummary } from '../serializers'
import { queryCatalog } from './catalog-query'

const RELATED_LIMIT = 5

function catalogRecords(): NftRecord[] {
  return mockRuntime.scenario().emptyCatalog ? [] : db.read().nfts
}

function findRecord(nftId: string): NftRecord | undefined {
  return catalogRecords().find((record) => record.id === nftId)
}

function nftNotFound() {
  return notFound('NFT não encontrado.')
}

export const catalogHandlers = [
  http.get(
    '/api/nfts',
    withNetwork(({ request }) => {
      const parsed = parseCatalogParams(new URL(request.url).searchParams)
      if (!parsed.success) return validationError(parsed.error)
      const result = queryCatalog(catalogRecords(), parsed.data)
      const body: CatalogResponse = { ...result, items: result.items.map(toNftSummary) }
      return HttpResponse.json(body)
    }),
  ),

  http.get(
    '/api/nfts/featured',
    withNetwork(() => {
      const hero = FEATURED_FIXTURE.heroIds.map(findRecord).filter((record) => record !== undefined)
      const spotlight = findRecord(FEATURED_FIXTURE.spotlight.id)
      if (!spotlight) return notFound('Nenhum destaque disponível.')
      const body: FeaturedResponse = {
        hero: hero.map(toNftSummary),
        spotlight: {
          ...toNftSummary(spotlight),
          headline: FEATURED_FIXTURE.spotlight.headline,
          tagline: FEATURED_FIXTURE.spotlight.tagline,
        },
      }
      return HttpResponse.json(body)
    }),
  ),

  http.get<{ nftId: string }>(
    '/api/nfts/:nftId',
    withNetwork(({ params }) => {
      const record = findRecord(params.nftId)
      if (!record) return nftNotFound()
      return HttpResponse.json(toNftDetail(record))
    }),
  ),

  http.get<{ nftId: string }>(
    '/api/nfts/:nftId/related',
    withNetwork(({ params }) => {
      const record = findRecord(params.nftId)
      if (!record) return nftNotFound()
      const others = catalogRecords().filter((item) => item.id !== record.id)
      const sameCollection = others.filter((item) => item.collection.id === record.collection.id)
      const rest = others.filter((item) => item.collection.id !== record.collection.id)
      const body: RelatedResponse = {
        items: [...sameCollection, ...rest].slice(0, RELATED_LIMIT).map(toNftSummary),
      }
      return HttpResponse.json(body)
    }),
  ),
]
