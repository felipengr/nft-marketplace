import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { REALTIME_EVENTS } from '@/api/contracts/realtime'
import { db } from '../db/database'
import { realtimeHub } from '../realtime/hub'

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL ?? 'wss://realtime.kurio.dev'

const realtime = ws.link(REALTIME_URL)

function userIdForToken(token: unknown): string | null {
  if (typeof token !== 'string' || !token) return null
  const session = db.read().sessions.find((item) => item.token === token)
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null
  return session.userId
}

export const realtimeHandlers = [
  realtime.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const registered = realtimeHub.register(io)

    io.client.on(REALTIME_EVENTS.identify, (_event, payload: { token?: unknown } | undefined) => {
      const userId = userIdForToken(payload?.token)
      realtimeHub.identify(registered.id, userId)
      io.client.emit(REALTIME_EVENTS.identified, { userId })
    })

    connection.client.addEventListener('close', () => realtimeHub.unregister(registered.id))
  }),
]
