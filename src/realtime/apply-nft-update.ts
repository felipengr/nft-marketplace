import type { QueryClient, QueryKey } from '@tanstack/react-query'
import type { Cart } from '@/api/contracts/cart'
import type { FavoritesResponse } from '@/api/contracts/favorites'
import type { CatalogResponse, FeaturedResponse, NftDetail, NftSummary, RelatedResponse } from '@/api/contracts/nft'
import type { NftUpdatedEvent } from '@/api/contracts/realtime'
import { nftKeys } from '@/queries/nft-queries'
import { privateKeys } from '@/queries/session-queries'
import { cartKeys } from '@/queries/cart-queries'

const MAX_SEEN_EVENTS = 500

export type ApplyResult =
  | { status: 'applied'; inCart: boolean; cartShortage: boolean; previous: NftSummary | null }
  | { status: 'duplicate' | 'stale' }

export class NftEventLedger {
  private readonly seen = new Set<string>()
  private readonly versions = new Map<string, number>()

  remember(eventId: string): boolean {
    if (this.seen.has(eventId)) return false
    this.seen.add(eventId)
    if (this.seen.size > MAX_SEEN_EVENTS) {
      const oldest = this.seen.values().next().value
      if (oldest) this.seen.delete(oldest)
    }
    return true
  }

  knownVersion(nftId: string): number {
    return this.versions.get(nftId) ?? 0
  }

  record(nftId: string, version: number): void {
    this.versions.set(nftId, Math.max(version, this.knownVersion(nftId)))
  }

  clear(): void {
    this.seen.clear()
    this.versions.clear()
  }
}

function patchSummary<T extends NftSummary>(item: T, event: NftUpdatedEvent): T {
  if (item.id !== event.resource.id || item.version >= event.version) return item
  return { ...item, price: event.data.price, previousPrice: event.data.previousPrice, available: event.data.available, version: event.version }
}

function patchDetail(detail: NftDetail, event: NftUpdatedEvent): NftDetail {
  if (detail.version >= event.version) return detail
  const byId = new Map(event.data.editions.map((edition) => [edition.id, edition]))
  return {
    ...patchSummary(detail, event),
    editions: detail.editions.map((edition) => {
      const next = byId.get(edition.id)
      return next ? { ...edition, available: next.available, maxPerOrder: next.maxPerOrder } : edition
    }),
  }
}

function cachedVersion(queryClient: QueryClient, nftId: string): { version: number; snapshot: NftSummary | null } {
  let version = 0
  let snapshot: NftSummary | null = null
  const consider = (item: NftSummary | undefined) => {
    if (item && item.id === nftId && item.version > version) {
      version = item.version
      snapshot = item
    }
  }
  consider(queryClient.getQueryData<NftDetail>(nftKeys.detail(nftId)))
  for (const [, data] of queryClient.getQueriesData<CatalogResponse>({ queryKey: nftKeys.catalogs() })) data?.items.forEach(consider)
  return { version, snapshot }
}

function cartKeysContaining(queryClient: QueryClient, nftId: string): QueryKey[] {
  const keys: QueryKey[] = []
  const isCartKey = (key: QueryKey) => key.at(-1) === 'cart' || (key[0] === 'cart' && key[1] === 'guest' && key.length === 3)
  for (const [key, data] of queryClient.getQueriesData<Cart>({ predicate: (query) => isCartKey(query.queryKey) })) {
    if (data?.items.some((line) => line.nftId === nftId)) keys.push(key)
  }
  return keys
}

export function applyNftUpdate(queryClient: QueryClient, ledger: NftEventLedger, event: NftUpdatedEvent): ApplyResult {
  if (!ledger.remember(event.eventId)) return { status: 'duplicate' }
  const nftId = event.resource.id
  const cached = cachedVersion(queryClient, nftId)
  if (event.version <= Math.max(ledger.knownVersion(nftId), cached.version)) return { status: 'stale' }
  ledger.record(nftId, event.version)

  queryClient.setQueryData<NftDetail>(nftKeys.detail(nftId), (detail) => (detail ? patchDetail(detail, event) : detail))
  queryClient.setQueriesData<CatalogResponse>({ queryKey: nftKeys.catalogs() }, (data) =>
    data ? { ...data, items: data.items.map((item) => patchSummary(item, event)) } : data,
  )
  queryClient.setQueryData<FeaturedResponse>(nftKeys.featured(), (data) =>
    data ? { hero: data.hero.map((item) => patchSummary(item, event)), spotlight: patchSummary(data.spotlight, event) } : data,
  )
  queryClient.setQueriesData<RelatedResponse>({ queryKey: [...nftKeys.all, 'related'] }, (data) =>
    data ? { items: data.items.map((item) => patchSummary(item, event)) } : data,
  )
  queryClient.setQueriesData<FavoritesResponse>(
    { predicate: (query) => query.queryKey[0] === privateKeys.all[0] && query.queryKey[2] === 'favorites' },
    (data) => (data ? { items: data.items.map((item) => patchSummary(item, event)) } : data),
  )
  void queryClient.invalidateQueries({ queryKey: nftKeys.catalogs(), refetchType: 'none' })

  const carts = cartKeysContaining(queryClient, nftId)
  const limits = new Map(event.data.editions.map((edition) => [edition.id, edition.maxPerOrder]))
  const cartShortage = carts.some((key) =>
    queryClient
      .getQueryData<Cart>(key)
      ?.items.some((line) => line.nftId === nftId && line.quantity > (limits.get(line.editionId) ?? line.quantity)),
  )
  for (const key of carts) {
    void queryClient.invalidateQueries({ queryKey: key, exact: true })
    void queryClient.invalidateQueries({ queryKey: cartKeys.quote(key) })
  }
  return { status: 'applied', inCart: carts.length > 0, cartShortage, previous: cached.snapshot }
}
