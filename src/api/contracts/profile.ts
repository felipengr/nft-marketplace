import { z } from 'zod'
import { ensLabelSchema } from './order'
import { passwordSchema, usernameSchema } from './session'

export const profileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.string(),
  ensName: z.string().nullable(),
  nickname: z.string().nullable(),
  avatarUrl: z.string().nullable(),
})

export type Profile = z.infer<typeof profileSchema>

export const updateProfileInputSchema = z.object({
  displayName: z.string().trim().min(2, { error: 'Informe o nome de exibição.' }).max(40, { error: 'Use no máximo 40 caracteres.' }),
  username: usernameSchema,
  email: z.email({ error: 'Informe um e-mail válido.' }),
  ensName: ensLabelSchema,
  nickname: z.string().trim().min(2, { error: 'Informe o apelido da carteira.' }).max(24, { error: 'Use no máximo 24 caracteres.' }),
})

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, { error: 'Informe a senha atual.' }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { error: 'Confirme a nova senha.' }),
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    path: ['confirmPassword'],
    error: 'As senhas não coincidem.',
  })
  .refine((input) => input.newPassword !== input.currentPassword, {
    path: ['newPassword'],
    error: 'A nova senha deve ser diferente da atual.',
  })

export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>

export const AVATAR_MAX_DATA_URL_LENGTH = 350_000

export const updateAvatarInputSchema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, { error: 'Envie uma imagem PNG, JPG ou WEBP.' })
    .max(AVATAR_MAX_DATA_URL_LENGTH, { error: 'A imagem é muito grande.' }),
})
