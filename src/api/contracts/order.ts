import { z } from 'zod'
import { ethAmountSchema, imageSchema, isoDateTimeSchema } from './common'
import { usernameSchema } from './session'
import { evmAddressSchema, walletNetworkSchema, walletProviderSchema } from './wallet'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])

export type OrderStatus = z.infer<typeof orderStatusSchema>

export const ensLabelSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{3,32}$/, { error: 'Use de 3 a 32 letras minúsculas, números ou hífen.' })

export const placeOrderInputSchema = z.object({
  buyer: z.object({
    displayName: z.string().trim().min(2, { error: 'Informe o nome de exibição.' }).max(40),
    username: usernameSchema,
    profileName: z.string().trim().min(2, { error: 'Informe o nome do perfil.' }).max(40),
    email: z.email({ error: 'Informe um e-mail válido.' }),
    ensName: ensLabelSchema,
  }),
  wallet: z.object({
    walletId: z.string().nullable(),
    address: evmAddressSchema,
    network: walletNetworkSchema,
    secondary: z.string().trim().max(64).nullable(),
  }),
  provider: walletProviderSchema,
  connectionId: z.string().min(1),
  referralCode: z.string().trim().max(16).nullable(),
  note: z.string().trim().max(280).nullable(),
  expected: z.object({ cartVersion: z.number().int().min(0), total: ethAmountSchema }),
})

export type PlaceOrderInput = z.infer<typeof placeOrderInputSchema>

export const orderItemSchema = z.object({
  nftId: z.string(),
  editionId: z.string(),
  editionLabel: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: imageSchema,
  unitPrice: ethAmountSchema,
  quantity: z.number().int().min(1),
  lineTotal: ethAmountSchema,
})

export type OrderItem = z.infer<typeof orderItemSchema>

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  version: z.number().int().min(1),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  items: z.array(orderItemSchema),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
  couponCode: z.string().nullable(),
  wallet: z.object({
    provider: walletProviderSchema,
    network: walletNetworkSchema,
    address: z.string(),
  }),
  transaction: z
    .object({
      hash: z.string(),
      explorerUrl: z.string(),
      explorerName: z.string(),
      confirmedAt: isoDateTimeSchema,
    })
    .nullable(),
  failureReason: z.string().nullable(),
})

export type Order = z.infer<typeof orderSchema>
