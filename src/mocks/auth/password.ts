function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(salt: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

export async function verifyPassword(salt: string, password: string, expectedHash: string): Promise<boolean> {
  return (await hashPassword(salt, password)) === expectedHash
}

export function createSalt(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}
