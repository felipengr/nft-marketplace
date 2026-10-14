import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { authEvents } from '@/api/auth-events'
import { sessionToken } from '@/api/session-token'
import { sessionKeys } from '@/queries/session-queries'
import { clearPrivateState, useSession } from './use-session'

const MAX_TIMEOUT = 2_147_483_647

export function SessionManager() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { session } = useSession()
  const handling = useRef(false)

  useEffect(() => {
    return authEvents.onAuthFailure((error) => {
      if (handling.current) return
      handling.current = true
      sessionToken.clear()
      clearPrivateState(queryClient)
      queryClient.setQueryData(sessionKeys.session, null)

      const expired = error.code === 'SESSION_EXPIRED'
      toast.warning(expired ? 'Sua sessão expirou. Entre novamente para continuar.' : 'Sua sessão não é mais válida. Entre novamente.', {
        id: 'session-ended',
      })

      const { location, matches } = router.state
      const isPrivate = matches.some((match) => match.routeId.startsWith('/_authenticated'))
      const finish = () => {
        handling.current = false
      }
      authEvents.consumeExpired()
      if (isPrivate) {
        void router
          .navigate({ to: '/login', search: { redirect: location.href, reason: expired ? 'expired' : undefined } })
          .finally(finish)
      } else {
        void router.invalidate().finally(finish)
      }
    })
  }, [queryClient, router])

  useEffect(() => {
    if (!session) return
    const remaining = Date.parse(session.expiresAt) - Date.now()
    const timer = window.setTimeout(
      () => void queryClient.invalidateQueries({ queryKey: sessionKeys.session }),
      Math.min(Math.max(remaining + 250, 0), MAX_TIMEOUT),
    )
    return () => window.clearTimeout(timer)
  }, [session, queryClient])

  return null
}
