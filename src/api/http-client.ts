import axios, { type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { ApiError, createApiError, toApiError } from './api-error'
import { authEvents } from './auth-events'
import { guestCartId } from './cart-identity'
import { sessionToken } from './session-token'

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register']

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10_000),
  headers: { Accept: 'application/json' },
})

httpClient.interceptors.request.use((config) => {
  const token = sessionToken.get()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  config.headers.set('X-Cart-Id', guestCartId.get())
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const config = axios.isAxiosError(error) ? error.config : undefined
    const sentToken = Boolean(config?.headers?.Authorization)
    const credentialCheck = AUTH_ENDPOINTS.some((endpoint) => config?.url?.startsWith(endpoint))
    if (apiError.isAuthError && sentToken && !credentialCheck) authEvents.emitAuthFailure(apiError)
    return Promise.reject(apiError)
  },
)

export async function request<TSchema extends z.ZodType>(
  schema: TSchema,
  config: AxiosRequestConfig,
): Promise<z.infer<TSchema>> {
  const response = await httpClient.request<unknown>(config)
  const parsed = schema.safeParse(response.data)
  if (!parsed.success) {
    throw createApiError('INVALID_RESPONSE', response.status)
  }
  return parsed.data
}

export async function requestVoid(config: AxiosRequestConfig): Promise<void> {
  await httpClient.request(config)
}

export { ApiError }
