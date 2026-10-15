import { createNftFixtures, type NftRecord } from '../fixtures/nfts'
import { createUserFixtures, type UserRecord } from '../fixtures/users'
import { createWalletFixtures, type WalletRecord } from '../fixtures/wallets'
import type { Order } from '@/api/contracts/order'

export type SessionRecord = {
  token: string
  userId: string
  createdAt: string
  expiresAt: string
}

export type CartItemRecord = {
  lineId: string
  nftId: string
  editionId: string
  quantity: number
  priceSnapshot: string
}

export type CartRecord = {
  id: string
  ownerId: string | null
  items: CartItemRecord[]
  couponCode: string | null
  version: number
  updatedAt: string
}

export type OrderRecord = Order & {
  userId: string
  cartId: string
  settleAt: string
  outcome: 'confirm' | 'reject'
}

export type IdempotencyRecord = {
  key: string
  userId: string
  requestHash: string
  orderId: string
}

export type MockDatabase = {
  schemaVersion: number
  nfts: NftRecord[]
  users: UserRecord[]
  sessions: SessionRecord[]
  carts: CartRecord[]
  favorites: Record<string, string[]>
  wallets: WalletRecord[]
  orders: OrderRecord[]
  idempotency: IdempotencyRecord[]
}

const SCHEMA_VERSION = 4

const STORAGE_KEY = 'kurio.mock-db'

function createSeed(): MockDatabase {
  return {
    schemaVersion: SCHEMA_VERSION,
    nfts: createNftFixtures(),
    users: createUserFixtures(),
    sessions: [],
    carts: [],
    favorites: {},
    wallets: createWalletFixtures(),
    orders: [],
    idempotency: [],
  }
}

let memoryState: MockDatabase | null = null

function readStorage(): MockDatabase | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MockDatabase
    return parsed.schemaVersion === SCHEMA_VERSION ? parsed : null
  } catch {
    return null
  }
}

function writeStorage(state: MockDatabase): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    return
  }
}

function load(): MockDatabase {
  const stored = readStorage()
  if (stored) {
    memoryState = stored
    return stored
  }
  if (memoryState) return memoryState
  const seed = createSeed()
  memoryState = seed
  writeStorage(seed)
  return seed
}

export const db = {
  read(): MockDatabase {
    return load()
  },
  write<T>(mutate: (state: MockDatabase) => T): T {
    const state = structuredClone(load())
    const result = mutate(state)
    memoryState = state
    writeStorage(state)
    return result
  },
  reset(): void {
    const seed = createSeed()
    memoryState = seed
    writeStorage(seed)
  },
}
