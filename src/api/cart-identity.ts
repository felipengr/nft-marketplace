const STORAGE_KEY = 'kurio.guest-cart-id'

let memoryId: string | null = null

function createId(): string {
  return `guest_${crypto.randomUUID().replace(/-/g, '')}`
}

function read(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function write(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id)
  } catch {
    return
  }
}

export const guestCartId = {
  get(): string {
    memoryId ??= read()
    if (!memoryId) {
      memoryId = createId()
      write(memoryId)
    }
    return memoryId
  },
  rotate(): string {
    memoryId = createId()
    write(memoryId)
    return memoryId
  },
}
