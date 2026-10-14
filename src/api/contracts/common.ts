import { z } from 'zod'
import { isEthAmount } from '@/lib/money'

export const ethAmountSchema = z.string().refine(isEthAmount, { message: 'Invalid ETH amount' })

export const isoDateTimeSchema = z.iso.datetime({ offset: true })

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'UNAVAILABLE',
  'INTERNAL_ERROR',
])

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
})

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>

export const paginationSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalItems: z.number().int().min(0),
  totalPages: z.number().int().min(0),
})

export type Pagination = z.infer<typeof paginationSchema>

export const imageSourceSchema = z.object({
  url: z.string(),
  width: z.number().int().positive(),
})

export const imageSchema = z.object({
  alt: z.string(),
  url: z.string(),
  sources: z.array(imageSourceSchema),
})

export type Image = z.infer<typeof imageSchema>
