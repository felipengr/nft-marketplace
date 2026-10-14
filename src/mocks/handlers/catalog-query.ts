import type { CatalogFacets, CatalogParams, Category, Network } from '@/api/contracts/nft'
import { compareEth } from '@/lib/money'
import { normalizeText } from '@/lib/text'
import { CATEGORY_LABELS, CATEGORY_ORDER, NETWORK_LABELS, NETWORK_ORDER } from '../fixtures/labels'
import type { NftRecord } from '../fixtures/nfts'

const TRENDING_THRESHOLD = 60

type Dimension = 'categories' | 'networks'

function matchesSearch(record: NftRecord, query: string): boolean {
  const haystack = normalizeText([record.name, record.tokenId, record.collection.name, record.creator.name].join(' '))
  return normalizeText(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

function matchesTab(record: NftRecord, tab: CatalogParams['tab']): boolean {
  if (tab === 'new') return record.isNewRelease
  if (tab === 'trending') return record.trendingScore >= TRENDING_THRESHOLD
  return true
}

function matchesPrice(record: NftRecord, params: CatalogParams): boolean {
  if (params.minPrice && compareEth(record.price, params.minPrice) < 0) return false
  if (params.maxPrice && compareEth(record.price, params.maxPrice) > 0) return false
  return true
}

function applyFilters(records: NftRecord[], params: CatalogParams, ignore?: Dimension): NftRecord[] {
  return records.filter((record) => {
    if (params.q && !matchesSearch(record, params.q)) return false
    if (!matchesTab(record, params.tab)) return false
    if (!matchesPrice(record, params)) return false
    if (ignore !== 'categories' && params.categories.length && !params.categories.includes(record.category)) return false
    if (ignore !== 'networks' && params.networks.length && !params.networks.includes(record.network)) return false
    return true
  })
}

function sortRecords(records: NftRecord[], sort: CatalogParams['sort']): NftRecord[] {
  const byId = (a: NftRecord, b: NftRecord) => a.id.localeCompare(b.id)
  const sorted = [...records]
  if (sort === 'price-asc') return sorted.sort((a, b) => compareEth(a.price, b.price) || byId(a, b))
  if (sort === 'price-desc') return sorted.sort((a, b) => compareEth(b.price, a.price) || byId(a, b))
  if (sort === 'rating') {
    return sorted.sort((a, b) => compareEth(b.rating.average, a.rating.average) || b.rating.count - a.rating.count || byId(a, b))
  }
  return sorted.sort((a, b) => Date.parse(b.listedAt) - Date.parse(a.listedAt) || byId(a, b))
}

function countBy<T extends string>(records: NftRecord[], order: T[], labels: Record<T, string>, read: (record: NftRecord) => T) {
  return order.map((value) => ({
    value,
    label: labels[value],
    count: records.filter((record) => read(record) === value).length,
  }))
}

function priceRange(records: NftRecord[]): CatalogFacets['priceRange'] {
  if (!records.length) return { min: '0', max: '0' }
  return records.reduce(
    (range, record) => ({
      min: compareEth(record.price, range.min) < 0 ? record.price : range.min,
      max: compareEth(record.price, range.max) > 0 ? record.price : range.max,
    }),
    { min: records[0].price, max: records[0].price },
  )
}

export function queryCatalog(records: NftRecord[], params: CatalogParams) {
  const filtered = sortRecords(applyFilters(records, params), params.sort)
  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / params.pageSize)
  const start = (params.page - 1) * params.pageSize
  const facets: CatalogFacets = {
    categories: countBy<Category>(applyFilters(records, params, 'categories'), CATEGORY_ORDER, CATEGORY_LABELS, (record) => record.category),
    networks: countBy<Network>(applyFilters(records, params, 'networks'), NETWORK_ORDER, NETWORK_LABELS, (record) => record.network),
    priceRange: priceRange(records),
  }
  return {
    items: filtered.slice(start, start + params.pageSize),
    pagination: { page: params.page, pageSize: params.pageSize, totalItems, totalPages },
    facets,
  }
}
