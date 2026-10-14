import { z } from 'zod'
import { ethAmountSchema } from '@/api/contracts/common'
import {
  catalogSortSchema,
  catalogTabSchema,
  categorySchema,
  networkSchema,
  type CatalogParamsInput,
} from '@/api/contracts/nft'

function listFromSearch<T extends z.ZodType>(item: T) {
  return z
    .preprocess((value) => {
      const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
      return raw.filter((entry) => item.safeParse(entry).success)
    }, z.array(item))
    .transform((values) => [...new Set(values)])
}

export const catalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  tab: catalogTabSchema.default('all').catch('all'),
  categories: listFromSearch(categorySchema).default([]).catch([]),
  networks: listFromSearch(networkSchema).default([]).catch([]),
  minPrice: ethAmountSchema.optional().catch(undefined),
  maxPrice: ethAmountSchema.optional().catch(undefined),
  sort: catalogSortSchema.default('recent').catch('recent'),
  page: z.coerce.number().int().min(1).default(1).catch(1),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export const CATALOG_SEARCH_DEFAULTS = {
  tab: 'all',
  categories: [],
  networks: [],
  sort: 'recent',
  page: 1,
} satisfies Partial<CatalogSearch>

export function toCatalogParams(search: CatalogSearch): CatalogParamsInput {
  return {
    q: search.q || undefined,
    tab: search.tab,
    categories: search.categories,
    networks: search.networks,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    sort: search.sort,
    page: search.page,
  }
}

export const CATALOG_SECTION_ID = 'catalogo'

export function catalogSummary(search: CatalogSearch, totalItems: number): string {
  const noun = totalItems === 1 ? 'NFT encontrado' : 'NFTs encontrados'
  return search.q ? `${totalItems} ${noun} para “${search.q}”` : `${totalItems} ${noun}`
}
