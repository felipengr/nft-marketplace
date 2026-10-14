const AUTH_PATHS = ['/login', '/register']

export function safeRedirect(target: unknown, fallback = '/'): string {
  if (typeof target !== 'string') return fallback
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return fallback
  const pathname = target.split(/[?#]/)[0]
  if (AUTH_PATHS.includes(pathname)) return fallback
  return target
}
