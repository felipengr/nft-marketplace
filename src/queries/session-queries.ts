import { queryOptions } from '@tanstack/react-query'
import { isApiError } from '@/api/api-error'
import type { Session } from '@/api/contracts/session'
import { fetchSession } from '@/api/session'
import { sessionToken } from '@/api/session-token'

export const sessionKeys = {
  session: ['session'] as const,
}

export const privateKeys = {
  all: ['private'] as const,
  user: (userId: string) => [...privateKeys.all, userId] as const,
}

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionKeys.session,
    queryFn: async ({ signal }): Promise<Session | null> => {
      if (!sessionToken.get()) return null
      try {
        return await fetchSession(signal)
      } catch (error) {
        if (isApiError(error) && error.isAuthError) {
          sessionToken.clear()
          return null
        }
        throw error
      }
    },
    staleTime: 5 * 60_000,
  })
}
