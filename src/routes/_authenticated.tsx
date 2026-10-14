import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { authEvents } from '@/api/auth-events'
import { sessionQueryOptions } from '@/queries/session-queries'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions())
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href, reason: authEvents.consumeExpired() ? 'expired' : undefined },
      })
    }
    return { session }
  },
  component: Outlet,
})
