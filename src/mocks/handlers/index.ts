import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { favoritesHandlers } from './favorites'
import { journalHandlers } from './journal'
import { realtimeHandlers } from './realtime'

export const handlers = [...authHandlers, ...catalogHandlers, ...journalHandlers, ...cartHandlers, ...favoritesHandlers, ...realtimeHandlers]
