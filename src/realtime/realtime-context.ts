import { createContext, useContext } from 'react'

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline'

export const RealtimeContext = createContext<RealtimeStatus>('connecting')

export function useRealtimeStatus(): RealtimeStatus {
  return useContext(RealtimeContext)
}
