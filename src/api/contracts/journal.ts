import { z } from 'zod'
import { imageSchema, isoDateTimeSchema } from './common'

export const journalPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  publishedAt: isoDateTimeSchema,
  readingMinutes: z.number().int().positive(),
  image: imageSchema,
})

export type JournalPost = z.infer<typeof journalPostSchema>

export const journalResponseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  items: z.array(journalPostSchema),
})

export type JournalResponse = z.infer<typeof journalResponseSchema>
