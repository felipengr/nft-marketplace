import type { PlaceOrderInput } from '@/api/contracts/order'
import { stableStringify } from '@/lib/stable-json'

const ATTEMPTS_KEY = 'kurio.order-attempts'
const PENDING_KEY = 'kurio.pending-order'
const MAX_ATTEMPTS = 20

type Attempts = Array<{ signature: string; key: string }>

function read<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(storage: Storage, key: string, value: unknown): void {
  try {
    if (value === null) storage.removeItem(key)
    else storage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export function idempotencyKeyFor(userId: string, input: PlaceOrderInput): string {
  const signature = stableStringify({ userId, input })
  const attempts = read<Attempts>(window.sessionStorage, ATTEMPTS_KEY, [])
  const existing = attempts.find((attempt) => attempt.signature === signature)
  if (existing) return existing.key
  const key = `ord-${crypto.randomUUID()}`
  write(window.sessionStorage, ATTEMPTS_KEY, [...attempts, { signature, key }].slice(-MAX_ATTEMPTS))
  return key
}

export type PendingOrderRef = { userId: string; orderId: string }

export const pendingOrder = {
  get(userId: string): string | null {
    const value = read<PendingOrderRef | null>(window.localStorage, PENDING_KEY, null)
    return value && value.userId === userId ? value.orderId : null
  },
  set(ref: PendingOrderRef): void {
    write(window.localStorage, PENDING_KEY, ref)
  },
  clear(orderId?: string): void {
    const value = read<PendingOrderRef | null>(window.localStorage, PENDING_KEY, null)
    if (!orderId || value?.orderId === orderId) write(window.localStorage, PENDING_KEY, null)
  },
}
