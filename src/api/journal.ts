import { request } from './http-client'
import { journalResponseSchema } from './contracts/journal'

export function fetchJournal(signal?: AbortSignal) {
  return request(journalResponseSchema, { method: 'GET', url: '/journal', signal })
}
