import axios, { type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { ApiError, createApiError, toApiError } from './api-error'
import { sessionToken } from './session-token'

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10_000),
  headers: { Accept: 'application/json' },
})

httpClient.interceptors.request.use((config) => {
  const token = sessionToken.get()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
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
