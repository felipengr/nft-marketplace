export function parseSearch(searchString: string): Record<string, string> {
  const params = new URLSearchParams(searchString.startsWith('?') ? searchString.slice(1) : searchString)
  return Object.fromEntries(params.entries())
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(','))
      continue
    }
    params.set(key, String(value))
  }
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}
