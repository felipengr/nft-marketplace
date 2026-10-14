import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { getErrorMessage, isApiError } from '@/api/api-error'

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  fields: ReadonlyArray<Path<T>>,
  setError: UseFormSetError<T>,
): string | null {
  if (!isApiError(error)) return getErrorMessage(error)
  let focused = false
  let matched = false
  for (const [key, message] of Object.entries(error.fields)) {
    const field = fields.find((candidate) => candidate === key)
    if (!field) continue
    setError(field, { type: 'server', message }, { shouldFocus: !focused })
    focused = true
    matched = true
  }
  return matched && error.code !== 'CONFLICT' ? null : error.message
}
