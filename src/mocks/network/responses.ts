import { HttpResponse } from 'msw'
import type { ZodError } from 'zod'
import type { ApiErrorBody, ApiErrorCode } from '@/api/contracts/common'

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION_ERROR: 'Os dados enviados são inválidos.',
  UNAUTHENTICATED: 'Você precisa entrar na sua conta.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'Recurso não encontrado.',
  CONFLICT: 'Conflito com o estado atual do recurso.',
  UNAVAILABLE: 'Serviço temporariamente indisponível.',
  INTERNAL_ERROR: 'Erro interno no servidor.',
}

const STATUS_CODES: Record<number, ApiErrorCode> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  500: 'INTERNAL_ERROR',
  503: 'UNAVAILABLE',
}

export function apiError(status: number, code: ApiErrorCode, message?: string, fields?: Record<string, string>) {
  const body: ApiErrorBody = { error: { code, message: message ?? DEFAULT_MESSAGES[code], ...(fields ? { fields } : {}) } }
  return HttpResponse.json(body, { status })
}

export function apiErrorFromStatus(status: number) {
  const code = STATUS_CODES[status] ?? 'INTERNAL_ERROR'
  return apiError(status, code)
}

export function validationError(error: ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    fields[key] ??= issue.message
  }
  return apiError(422, 'VALIDATION_ERROR', 'Revise os campos destacados.', fields)
}

export function notFound(message: string) {
  return apiError(404, 'NOT_FOUND', message)
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
