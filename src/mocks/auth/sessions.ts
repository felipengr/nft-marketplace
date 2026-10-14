import { db, type SessionRecord } from '../db/database'
import type { UserRecord } from '../fixtures/users'
import { apiError } from '../network/responses'
import { mockRuntime } from '../network/runtime'

export type AuthContext = { user: UserRecord; session: SessionRecord }

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim() || null
}

export function createSession(userId: string): SessionRecord {
  const now = Date.now()
  const session: SessionRecord = {
    token: crypto.randomUUID(),
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + mockRuntime.scenario().sessionTtlMs).toISOString(),
  }
  db.write((state) => {
    state.sessions = state.sessions.filter((item) => Date.parse(item.expiresAt) > now)
    state.sessions.push(session)
  })
  return session
}

export function revokeSession(token: string): void {
  db.write((state) => {
    state.sessions = state.sessions.filter((item) => item.token !== token)
  })
}

export function expireAllSessions(): void {
  const now = new Date().toISOString()
  db.write((state) => {
    state.sessions = state.sessions.map((item) => ({ ...item, expiresAt: now }))
  })
}

export function authenticate(request: Request): AuthContext | ReturnType<typeof apiError> {
  const token = readBearerToken(request)
  if (!token) return apiError(401, 'UNAUTHENTICATED')
  const state = db.read()
  const session = state.sessions.find((item) => item.token === token)
  if (!session) return apiError(401, 'UNAUTHENTICATED')
  if (Date.parse(session.expiresAt) <= Date.now()) return apiError(401, 'SESSION_EXPIRED')
  const user = state.users.find((item) => item.id === session.userId)
  if (!user) return apiError(401, 'UNAUTHENTICATED')
  return { user, session }
}
