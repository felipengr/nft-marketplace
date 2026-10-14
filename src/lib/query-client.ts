import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/api/api-error'

const MAX_QUERY_RETRIES = 2

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return isApiError(error) && error.isTransient && failureCount < MAX_QUERY_RETRIES
}

export function retryDelay(attempt: number): number {
  return Math.min(500 * 2 ** attempt, 4000)
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetryQuery,
        retryDelay,
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
