import { z } from 'zod'
import { isoDateTimeSchema } from './common'

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
  ensName: z.string().nullable(),
})

export type User = z.infer<typeof userSchema>

export const sessionSchema = z.object({
  user: userSchema,
  expiresAt: isoDateTimeSchema,
})

export type Session = z.infer<typeof sessionSchema>

export const authResponseSchema = sessionSchema.extend({
  token: z.string().min(1),
})

export type AuthResponse = z.infer<typeof authResponseSchema>

export const loginInputSchema = z.object({
  email: z.email({ error: 'Informe um e-mail válido.' }),
  password: z.string().min(1, { error: 'Informe sua senha.' }),
})

export type LoginInput = z.infer<typeof loginInputSchema>

export const passwordSchema = z
  .string()
  .min(8, { error: 'A senha deve ter pelo menos 8 caracteres.' })
  .regex(/[A-Za-z]/, { error: 'A senha deve conter letras.' })
  .regex(/\d/, { error: 'A senha deve conter números.' })

export const usernameSchema = z
  .string()
  .trim()
  .min(3, { error: 'O nome de usuário deve ter pelo menos 3 caracteres.' })
  .max(24, { error: 'O nome de usuário deve ter no máximo 24 caracteres.' })
  .regex(/^[a-z0-9._]+$/, { error: 'Use apenas letras minúsculas, números, ponto e sublinhado.' })

export const registerInputSchema = z
  .object({
    username: usernameSchema,
    email: z.email({ error: 'Informe um e-mail válido.' }),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((input) => input.password === input.confirmPassword, {
    path: ['confirmPassword'],
    error: 'As senhas não coincidem.',
  })

export type RegisterInput = z.infer<typeof registerInputSchema>
