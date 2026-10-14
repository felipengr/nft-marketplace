import { catalogParamsSchema, type CatalogParams, type CatalogParamsInput } from './nft'

function splitList(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function serializeCatalogParams(input: CatalogParamsInput): URLSearchParams {
  const params = catalogParamsSchema.parse(input)
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  search.set('tab', params.tab)
  if (params.categories.length) search.set('categories', [...params.categories].sort().join(','))
  if (params.networks.length) search.set('networks', [...params.networks].sort().join(','))
  if (params.minPrice) search.set('minPrice', params.minPrice)
  if (params.maxPrice) search.set('maxPrice', params.maxPrice)
  search.set('sort', params.sort)
  search.set('page', String(params.page))
  search.set('pageSize', String(params.pageSize))
  return search
}

export function parseCatalogParams(search: URLSearchParams): ReturnType<typeof catalogParamsSchema.safeParse> {
  const page = search.get('page')
  const pageSize = search.get('pageSize')
  return catalogParamsSchema.safeParse({
    q: search.get('q') ?? undefined,
    tab: search.get('tab') ?? undefined,
    categories: splitList(search.get('categories')),
    networks: splitList(search.get('networks')),
    minPrice: search.get('minPrice') ?? undefined,
    maxPrice: search.get('maxPrice') ?? undefined,
    sort: search.get('sort') ?? undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  })
}

export type { CatalogParams }
