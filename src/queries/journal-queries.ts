import { queryOptions } from '@tanstack/react-query'
import { fetchJournal } from '@/api/journal'

export function journalQueryOptions() {
  return queryOptions({
    queryKey: ['journal'] as const,
    queryFn: ({ signal }) => fetchJournal(signal),
    staleTime: 10 * 60_000,
  })
}
