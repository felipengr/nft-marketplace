import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { favoritesHandlers } from './favorites'
import { journalHandlers } from './journal'

export const handlers = [...authHandlers, ...catalogHandlers, ...journalHandlers, ...cartHandlers, ...favoritesHandlers]
