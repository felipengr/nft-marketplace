import { HttpResponse, http } from 'msw'
import { loginInputSchema, registerInputSchema, type AuthResponse, type Session } from '@/api/contracts/session'
import { createSalt, hashPassword, verifyPassword } from '../auth/password'
import { authenticate, createSession, readBearerToken, revokeSession } from '../auth/sessions'
import { db } from '../db/database'
import type { UserRecord } from '../fixtures/users'
import { apiError, readJson, validationError } from '../network/responses'
import { withNetwork } from '../network/simulate'
import { toUser } from '../serializers'

function authResponse(user: UserRecord, status = 200) {
  const session = createSession(user.id)
  const body: AuthResponse = { token: session.token, user: toUser(user), expiresAt: session.expiresAt }
  return HttpResponse.json(body, { status })
}

export const authHandlers = [
  http.post(
    '/api/auth/login',
    withNetwork(async ({ request }) => {
      const parsed = loginInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      const email = parsed.data.email.trim().toLowerCase()
      const user = db.read().users.find((item) => item.email.toLowerCase() === email)
      const valid = user ? await verifyPassword(user.passwordSalt, parsed.data.password, user.passwordHash) : false
      if (!user || !valid) return apiError(401, 'UNAUTHENTICATED', 'E-mail ou senha inválidos.')
      return authResponse(user)
    }),
  ),

  http.post(
    '/api/auth/register',
    withNetwork(async ({ request }) => {
      const parsed = registerInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      const email = parsed.data.email.trim().toLowerCase()
      const username = parsed.data.username.trim().toLowerCase()
      const { users } = db.read()
      const fields: Record<string, string> = {}
      if (users.some((item) => item.email.toLowerCase() === email)) fields.email = 'Este e-mail já está cadastrado.'
      if (users.some((item) => item.username === username)) fields.username = 'Este nome de usuário já está em uso.'
      if (Object.keys(fields).length) return apiError(409, 'CONFLICT', 'Já existe uma conta com estes dados.', fields)

      const salt = createSalt()
      const user: UserRecord = {
        id: `usr_${crypto.randomUUID().slice(0, 8)}`,
        username,
        displayName: username,
        email,
        avatarUrl: null,
        ensName: null,
        passwordSalt: salt,
        passwordHash: await hashPassword(salt, parsed.data.password),
        createdAt: new Date().toISOString(),
      }
      db.write((state) => {
        state.users.push(user)
      })
      return authResponse(user, 201)
    }),
  ),

  http.get(
    '/api/session',
    withNetwork(({ request }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const body: Session = { user: toUser(auth.user), expiresAt: auth.session.expiresAt }
      return HttpResponse.json(body)
    }),
  ),

  http.post(
    '/api/auth/logout',
    withNetwork(({ request }) => {
      const token = readBearerToken(request)
      if (token) revokeSession(token)
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
