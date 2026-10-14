import { authHandlers } from './auth'
import { catalogHandlers } from './catalog'
import { journalHandlers } from './journal'

export const handlers = [...authHandlers, ...catalogHandlers, ...journalHandlers]
