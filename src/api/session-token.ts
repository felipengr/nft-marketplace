const STORAGE_KEY = 'kurio.session-token'

let memoryToken: string | null = null

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStorage(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(STORAGE_KEY, token)
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    return
  }
}

export const sessionToken = {
  get(): string | null {
    memoryToken ??= readStorage()
    return memoryToken
  },
  set(token: string): void {
    memoryToken = token
    writeStorage(token)
  },
  clear(): void {
    memoryToken = null
    writeStorage(null)
  },
}
