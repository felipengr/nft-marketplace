import { HttpResponse, http } from 'msw'
import { changePasswordInputSchema, updateAvatarInputSchema, updateProfileInputSchema, type Profile } from '@/api/contracts/profile'
import { upsertWalletInputSchema, walletKindSchema, walletSchema } from '@/api/contracts/wallet'
import { createSalt, hashPassword, verifyPassword } from '../auth/password'
import { authenticate } from '../auth/sessions'
import { db } from '../db/database'
import type { UserRecord } from '../fixtures/users'
import type { WalletRecord } from '../fixtures/wallets'
import { apiError, readJson, validationError } from '../network/responses'
import { withNetwork } from '../network/simulate'

function toProfile(user: UserRecord): Profile {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
  }
}

function updateUser(userId: string, mutate: (user: UserRecord) => void): UserRecord {
  return db.write((state) => {
    const user = state.users.find((item) => item.id === userId)
    if (!user) throw new Error('User not found')
    mutate(user)
    return structuredClone(user)
  })
}

export const accountHandlers = [
  http.get(
    '/api/profile',
    withNetwork(({ request }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      return HttpResponse.json(toProfile(auth.user))
    }),
  ),

  http.patch(
    '/api/profile',
    withNetwork(async ({ request }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const parsed = updateProfileInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      const input = parsed.data
      const email = input.email.trim().toLowerCase()
      const username = input.username.trim().toLowerCase()
      const others = db.read().users.filter((user) => user.id !== auth.user.id)
      const fields: Record<string, string> = {}
      if (others.some((user) => user.email.toLowerCase() === email)) fields.email = 'Este e-mail já está em uso por outra conta.'
      if (others.some((user) => user.username === username)) fields.username = 'Este nome de usuário já está em uso.'
      if (Object.keys(fields).length) return apiError(409, 'CONFLICT', 'Alguns dados já pertencem a outra conta.', fields)
      const user = updateUser(auth.user.id, (target) => {
        target.displayName = input.displayName
        target.username = username
        target.email = email
        target.ensName = input.ensName
        target.nickname = input.nickname
      })
      return HttpResponse.json(toProfile(user))
    }),
  ),

  http.put(
    '/api/profile/avatar',
    withNetwork(async ({ request }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const parsed = updateAvatarInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      const user = updateUser(auth.user.id, (target) => {
        target.avatarUrl = parsed.data.dataUrl
      })
      return HttpResponse.json(toProfile(user))
    }),
  ),

  http.delete(
    '/api/profile/avatar',
    withNetwork(({ request }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const user = updateUser(auth.user.id, (target) => {
        target.avatarUrl = null
      })
      return HttpResponse.json(toProfile(user))
    }),
  ),

  http.post(
    '/api/profile/password',
    withNetwork(async ({ request }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const parsed = changePasswordInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      const valid = await verifyPassword(auth.user.passwordSalt, parsed.data.currentPassword, auth.user.passwordHash)
      if (!valid) {
        return apiError(422, 'VALIDATION_ERROR', 'A senha atual está incorreta.', { currentPassword: 'A senha atual está incorreta.' })
      }
      const salt = createSalt()
      const hash = await hashPassword(salt, parsed.data.newPassword)
      updateUser(auth.user.id, (target) => {
        target.passwordSalt = salt
        target.passwordHash = hash
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.put<{ kind: string }>(
    '/api/wallets/:kind',
    withNetwork(async ({ request, params }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      const kind = walletKindSchema.safeParse(params.kind)
      if (!kind.success) return apiError(404, 'NOT_FOUND', 'Tipo de carteira inexistente.')
      const parsed = upsertWalletInputSchema.safeParse(await readJson(request))
      if (!parsed.success) return validationError(parsed.error)
      const existing = db.read().wallets.filter((wallet) => wallet.userId === auth.user.id)
      if (kind.data === 'secondary' && !existing.some((wallet) => wallet.kind === 'primary')) {
        return apiError(422, 'VALIDATION_ERROR', 'Cadastre a carteira principal antes da secundária.')
      }
      const address = parsed.data.address.toLowerCase()
      const takenByOther = db
        .read()
        .wallets.some((wallet) => wallet.userId !== auth.user.id && wallet.address.toLowerCase() === address)
      if (takenByOther) {
        return apiError(409, 'CONFLICT', 'Este endereço já está vinculado a outra conta.', { address: 'Este endereço já está vinculado a outra conta.' })
      }
      const record: WalletRecord = {
        id: `wal_${auth.user.id}_${kind.data}`,
        userId: auth.user.id,
        kind: kind.data,
        ...parsed.data,
      }
      db.write((state) => {
        state.wallets = state.wallets.filter((wallet) => !(wallet.userId === auth.user.id && wallet.kind === kind.data))
        state.wallets.push(record)
      })
      return HttpResponse.json(walletSchema.parse(record))
    }),
  ),

  http.delete<{ kind: string }>(
    '/api/wallets/:kind',
    withNetwork(({ request, params }) => {
      const auth = authenticate(request)
      if (auth instanceof Response) return auth
      if (params.kind !== 'secondary') return apiError(422, 'VALIDATION_ERROR', 'A carteira principal não pode ser removida, apenas editada.')
      db.write((state) => {
        state.wallets = state.wallets.filter((wallet) => !(wallet.userId === auth.user.id && wallet.kind === 'secondary'))
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
