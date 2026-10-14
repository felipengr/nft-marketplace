import { request, requestVoid } from './http-client'
import {
  authResponseSchema,
  sessionSchema,
  type LoginInput,
  type RegisterInput,
} from './contracts/session'

export function fetchSession(signal?: AbortSignal) {
  return request(sessionSchema, { method: 'GET', url: '/session', signal })
}

export function login(input: LoginInput) {
  return request(authResponseSchema, { method: 'POST', url: '/auth/login', data: input })
}

export function register(input: RegisterInput) {
  return request(authResponseSchema, { method: 'POST', url: '/auth/register', data: input })
}

export function logout() {
  return requestVoid({ method: 'POST', url: '/auth/logout' })
}
