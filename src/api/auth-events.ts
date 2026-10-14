import type { ApiError } from './api-error'

type AuthFailureListener = (error: ApiError) => void

const listeners = new Set<AuthFailureListener>()

let pending: ApiError | null = null

let expiredFlag = false

export const authEvents = {
  onAuthFailure(listener: AuthFailureListener): () => void {
    listeners.add(listener)
    if (pending) {
      const error = pending
      pending = null
      queueMicrotask(() => listener(error))
    }
    return () => listeners.delete(listener)
  },
  emitAuthFailure(error: ApiError): void {
    if (error.code === 'SESSION_EXPIRED') expiredFlag = true
    if (listeners.size === 0) {
      pending = error
      return
    }
    listeners.forEach((listener) => listener(error))
  },
  consumeExpired(): boolean {
    const expired = expiredFlag
    expiredFlag = false
    return expired
  },
}
