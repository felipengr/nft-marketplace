import { z } from 'zod'
import { ethAmountSchema, imageSchema, isoDateTimeSchema, paginationSchema } from './common'

export const networkSchema = z.enum(['ethereum', 'polygon', 'solana'])

export type Network = z.infer<typeof networkSchema>

export const categorySchema = z.enum([
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
])

export type Category = z.infer<typeof categorySchema>

export const catalogTabSchema = z.enum(['all', 'new', 'trending'])

export type CatalogTab = z.infer<typeof catalogTabSchema>

export const catalogSortSchema = z.enum(['recent', 'price-asc', 'price-desc', 'rating'])

export type CatalogSort = z.infer<typeof catalogSortSchema>

export const CATALOG_PAGE_SIZE = 9

export const catalogParamsSchema = z.object({
  q: z.string().trim().max(80).optional(),
  tab: catalogTabSchema.default('all'),
  categories: z.array(categorySchema).default([]),
  networks: z.array(networkSchema).default([]),
  minPrice: ethAmountSchema.optional(),
  maxPrice: ethAmountSchema.optional(),
  sort: catalogSortSchema.default('recent'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(48).default(CATALOG_PAGE_SIZE),
})

export type CatalogParams = z.infer<typeof catalogParamsSchema>
export type CatalogParamsInput = z.input<typeof catalogParamsSchema>

export const labeledOptionSchema = <T extends z.ZodType>(value: T) =>
  z.object({
    value,
    label: z.string(),
  })

export const editionSchema = z.object({
  id: z.string(),
  label: z.string(),
  supply: z.number().int().positive().nullable(),
  available: z.number().int().min(0),
  maxPerOrder: z.number().int().min(0),
})

export type Edition = z.infer<typeof editionSchema>

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  tokenId: z.string(),
  price: ethAmountSchema,
  previousPrice: ethAmountSchema.nullable(),
  image: imageSchema,
  network: labeledOptionSchema(networkSchema),
  category: labeledOptionSchema(categorySchema),
  badge: z.string().nullable(),
  available: z.number().int().min(0),
  listedAt: isoDateTimeSchema,
  version: z.number().int().min(1),
})

export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftDetailSchema = nftSummarySchema.extend({
  summary: z.string(),
  description: z.array(z.string()),
  collection: z.object({ id: z.string(), name: z.string() }),
  attributes: z.array(z.string()),
  gallery: z.array(imageSchema).min(1),
  editions: z.array(editionSchema).min(1),
  rating: z.object({ average: z.string(), count: z.number().int().min(0) }),
  creator: z.object({ name: z.string(), royaltyPercent: z.string() }),
  networkDetails: z.string(),
  contract: z.object({ address: z.string(), standard: z.string(), details: z.string() }),
  royaltyDetails: z.string(),
})

export type NftDetail = z.infer<typeof nftDetailSchema>

export const facetOptionSchema = <T extends z.ZodType>(value: T) =>
  labeledOptionSchema(value).extend({ count: z.number().int().min(0) })

export const catalogFacetsSchema = z.object({
  categories: z.array(facetOptionSchema(categorySchema)),
  networks: z.array(facetOptionSchema(networkSchema)),
  priceRange: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
})

export type CatalogFacets = z.infer<typeof catalogFacetsSchema>

export const catalogResponseSchema = z.object({
  items: z.array(nftSummarySchema),
  pagination: paginationSchema,
  facets: catalogFacetsSchema,
})

export type CatalogResponse = z.infer<typeof catalogResponseSchema>

export const featuredResponseSchema = z.object({
  hero: z.array(nftSummarySchema),
  spotlight: nftSummarySchema.extend({ headline: z.string(), tagline: z.string() }),
})

export type FeaturedResponse = z.infer<typeof featuredResponseSchema>

export const relatedResponseSchema = z.object({
  items: z.array(nftSummarySchema),
})

export type RelatedResponse = z.infer<typeof relatedResponseSchema>
