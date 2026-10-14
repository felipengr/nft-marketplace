import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { safeRedirect } from '@/lib/safe-redirect'
import { sessionQueryOptions } from '@/queries/session-queries'

export const authSearchSchema = z.object({
  redirect: z.string().max(500).optional().catch(undefined),
  reason: z.enum(['expired']).optional().catch(undefined),
})

export type AuthSearch = z.infer<typeof authSearchSchema>

export async function redirectIfAuthenticated(queryClient: QueryClient, search: AuthSearch): Promise<void> {
  const session = await queryClient.ensureQueryData(sessionQueryOptions())
  if (session) throw redirect({ href: safeRedirect(search.redirect), replace: true })
}
