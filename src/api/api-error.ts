import axios from 'axios'
import { apiErrorBodySchema, type ApiErrorCode } from './contracts/common'

export type ClientErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'CANCELED' | 'INVALID_RESPONSE'

const TRANSIENT_CODES: ReadonlySet<ClientErrorCode> = new Set(['NETWORK_ERROR', 'TIMEOUT', 'UNAVAILABLE', 'INTERNAL_ERROR'])

const FALLBACK_MESSAGES: Record<ClientErrorCode, string> = {
  VALIDATION_ERROR: 'Revise os campos destacados.',
  UNAUTHENTICATED: 'Entre na sua conta para continuar.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente para continuar.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Não encontramos o que você procura.',
  CONFLICT: 'Os dados mudaram. Revise e tente novamente.',
  UNAVAILABLE: 'Serviço indisponível no momento. Tente novamente.',
  INTERNAL_ERROR: 'Algo deu errado. Tente novamente.',
  NETWORK_ERROR: 'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
  TIMEOUT: 'O servidor demorou para responder. Tente novamente.',
  CANCELED: 'Requisição cancelada.',
  INVALID_RESPONSE: 'Recebemos uma resposta inesperada do servidor.',
}

export class ApiError extends Error {
  readonly code: ClientErrorCode
  readonly status: number | null
  readonly fields: Record<string, string>

  constructor(code: ClientErrorCode, message: string, status: number | null = null, fields: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fields = fields
  }

  get isTransient(): boolean {
    return TRANSIENT_CODES.has(this.code)
  }

  get isAuthError(): boolean {
    return this.code === 'UNAUTHENTICATED' || this.code === 'SESSION_EXPIRED'
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function createApiError(code: ClientErrorCode, status: number | null = null): ApiError {
  return new ApiError(code, FALLBACK_MESSAGES[code], status)
}

function codeFromStatus(status: number): ClientErrorCode {
  if (status === 400 || status === 422) return 'VALIDATION_ERROR'
  if (status === 401) return 'UNAUTHENTICATED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 503) return 'UNAVAILABLE'
  return 'INTERNAL_ERROR'
}

export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error
  if (axios.isCancel(error)) return createApiError('CANCELED')
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return createApiError('TIMEOUT')
    const response = error.response
    if (!response) return createApiError('NETWORK_ERROR')
    const body = apiErrorBodySchema.safeParse(response.data)
    if (body.success) {
      const { code, message, fields } = body.data.error
      return new ApiError(code, message, response.status, fields ?? {})
    }
    return createApiError(codeFromStatus(response.status), response.status)
  }
  return createApiError('INVALID_RESPONSE')
}

export function getErrorMessage(error: unknown): string {
  return isApiError(error) ? error.message : FALLBACK_MESSAGES.INTERNAL_ERROR
}
