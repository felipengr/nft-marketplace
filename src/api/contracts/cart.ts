import { z } from 'zod'
import { ethAmountSchema, imageSchema, isoDateTimeSchema } from './common'

export const cartLineSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  editionLabel: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: imageSchema,
  unitPrice: ethAmountSchema,
  quantity: z.number().int().min(1),
  maxQuantity: z.number().int().min(0),
  lineTotal: ethAmountSchema,
})

export type CartLine = z.infer<typeof cartLineSchema>

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(cartLineSchema),
  itemCount: z.number().int().min(0),
  couponCode: z.string().nullable(),
  version: z.number().int().min(0),
})

export type Cart = z.infer<typeof cartSchema>

export const quoteIssueSchema = z.object({
  lineId: z.string().nullable(),
  kind: z.enum(['price-changed', 'insufficient-stock', 'sold-out', 'coupon-not-applicable']),
  message: z.string(),
})

export type QuoteIssue = z.infer<typeof quoteIssueSchema>

export const quoteSchema = z.object({
  cartVersion: z.number().int().min(0),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  discountLabel: z.string(),
  networkFee: ethAmountSchema,
  networkFeeLabel: z.string(),
  total: ethAmountSchema,
  coupon: z.object({ code: z.string(), description: z.string() }).nullable(),
  issues: z.array(quoteIssueSchema),
  expiresAt: isoDateTimeSchema,
})

export type Quote = z.infer<typeof quoteSchema>

export const addCartItemInputSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1).optional(),
  quantity: z.number().int().min(1).max(99),
})

export type AddCartItemInput = z.infer<typeof addCartItemInputSchema>

export const updateCartItemInputSchema = z.object({
  quantity: z.number().int().min(1).max(99),
})

export const applyCouponInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { error: 'Digite o código promocional.' })
    .max(32, { error: 'Código muito longo.' }),
})

export type ApplyCouponInput = z.infer<typeof applyCouponInputSchema>

export const mergeCartInputSchema = z.object({
  guestCartId: z.string().min(8).max(64),
})
