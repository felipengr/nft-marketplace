import { z } from 'zod'
import { ethAmountSchema, isoDateTimeSchema } from './common'

export const REALTIME_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
  identify: 'session.identify',
  identified: 'session.identified',
} as const

const eventEnvelope = <TType extends z.ZodType, TData extends z.ZodType>(resourceType: TType, data: TData) =>
  z.object({
    eventId: z.string().min(1),
    resource: z.object({ type: resourceType, id: z.string().min(1) }),
    version: z.number().int().min(1),
    occurredAt: isoDateTimeSchema,
    data,
  })

export const nftUpdatedEventSchema = eventEnvelope(
  z.literal('nft'),
  z.object({
    price: ethAmountSchema,
    previousPrice: ethAmountSchema.nullable(),
    available: z.number().int().min(0),
    editions: z.array(z.object({ id: z.string(), available: z.number().int().min(0), maxPerOrder: z.number().int().min(0) })),
  }),
)

export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const identifiedPayloadSchema = z.object({
  userId: z.string().nullable(),
})

export const orderUpdatedEventSchema = eventEnvelope(
  z.literal('order'),
  z.object({
    userId: z.string(),
    status: z.enum(['pending', 'confirmed', 'rejected']),
  }),
)

export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>
