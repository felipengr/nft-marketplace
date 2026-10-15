import type { toSocketIo } from '@mswjs/socket.io-binding'
import { REALTIME_EVENTS, type NftUpdatedEvent } from '@/api/contracts/realtime'
import type { NftRecord } from '../fixtures/nfts'

type SocketIo = ReturnType<typeof toSocketIo>

type RealtimeConnection = {
  id: number
  io: SocketIo
  userId: string | null
  heartbeat: number
}

const HEARTBEAT_MS = 20_000

const connections = new Map<number, RealtimeConnection>()

let nextId = 1

let lastNftEvent: NftUpdatedEvent | null = null

function isOpen(connection: RealtimeConnection): boolean {
  const client = connection.io.rawClient as { socket?: WebSocket }
  return !client.socket || client.socket.readyState === WebSocket.OPEN
}

function prune(): void {
  connections.forEach((connection) => {
    if (!isOpen(connection)) realtimeHub.unregister(connection.id)
  })
}

export const realtimeHub = {
  register(io: SocketIo): RealtimeConnection {
    const id = nextId++
    const heartbeat = window.setInterval(() => {
      prune()
      if (connections.has(id)) io.rawClient.send('2')
    }, HEARTBEAT_MS)
    const connection: RealtimeConnection = { id, io, userId: null, heartbeat }
    connections.set(id, connection)
    return connection
  },
  unregister(id: number): void {
    const connection = connections.get(id)
    if (!connection) return
    window.clearInterval(connection.heartbeat)
    connections.delete(id)
  },
  identify(id: number, userId: string | null): void {
    const connection = connections.get(id)
    if (connection) connection.userId = userId
  },
  broadcast(event: string, payload: unknown): void {
    prune()
    connections.forEach((connection) => connection.io.client.emit(event, payload))
  },
  sendToUser(userId: string, event: string, payload: unknown): void {
    prune()
    connections.forEach((connection) => {
      if (connection.userId === userId) connection.io.client.emit(event, payload)
    })
  },
  emitNftUpdated(record: NftRecord): NftUpdatedEvent {
    const event: NftUpdatedEvent = {
      eventId: `evt_${crypto.randomUUID()}`,
      resource: { type: 'nft', id: record.id },
      version: record.version,
      occurredAt: new Date().toISOString(),
      data: {
        price: record.price,
        previousPrice: record.previousPrice,
        available: record.editions.reduce((total, edition) => total + edition.available, 0),
        editions: record.editions.map(({ id, available, maxPerOrder }) => ({ id, available, maxPerOrder })),
      },
    }
    lastNftEvent = event
    this.broadcast(REALTIME_EVENTS.nftUpdated, event)
    return event
  },
  replayLastNftEvent(): NftUpdatedEvent | null {
    if (lastNftEvent) this.broadcast(REALTIME_EVENTS.nftUpdated, lastNftEvent)
    return lastNftEvent
  },
  emitStaleNftEvent(record: NftRecord, price: string): NftUpdatedEvent {
    const event: NftUpdatedEvent = {
      eventId: `evt_${crypto.randomUUID()}`,
      resource: { type: 'nft', id: record.id },
      version: Math.max(1, record.version - 1),
      occurredAt: new Date(Date.now() - 60_000).toISOString(),
      data: {
        price,
        previousPrice: null,
        available: record.editions.reduce((total, edition) => total + edition.available, 0),
        editions: record.editions.map(({ id, available, maxPerOrder }) => ({ id, available, maxPerOrder })),
      },
    }
    this.broadcast(REALTIME_EVENTS.nftUpdated, event)
    return event
  },
  disconnectAll(): number {
    prune()
    const count = connections.size
    connections.forEach((connection) => connection.io.rawClient.close(4000, 'Simulated network drop'))
    return count
  },
  connectionCount(): number {
    prune()
    return connections.size
  },
}
