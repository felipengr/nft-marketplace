import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { AuthResponse, LoginInput, RegisterInput, Session } from '@/api/contracts/session'
import { login, logout, register } from '@/api/session'
import { sessionToken } from '@/api/session-token'
import { privateKeys, sessionKeys, sessionQueryOptions } from '@/queries/session-queries'

export function useSession() {
  const query = useQuery(sessionQueryOptions())
  return {
    session: query.data ?? null,
    user: query.data?.user ?? null,
    isLoading: query.isPending,
    isAuthenticated: Boolean(query.data),
  }
}

export function clearPrivateState(queryClient: QueryClient): void {
  void queryClient.cancelQueries({ queryKey: privateKeys.all })
  queryClient.removeQueries({ queryKey: privateKeys.all })
}

function applySession(queryClient: QueryClient, response: AuthResponse): void {
  clearPrivateState(queryClient)
  sessionToken.set(response.token)
  const session: Session = { user: response.user, expiresAt: response.expiresAt }
  queryClient.setQueryData(sessionKeys.session, session)
}

export function useLogin() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: async (response) => {
      applySession(queryClient, response)
      toast.success(`Bem-vindo de volta, ${response.user.displayName}!`)
      await router.invalidate()
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: async (response) => {
      applySession(queryClient, response)
      toast.success('Conta criada com sucesso. Bem-vindo à Kurio!')
      await router.invalidate()
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: async () => {
      try {
        await logout()
      } catch {
        return
      }
    },
    onSettled: async () => {
      sessionToken.clear()
      clearPrivateState(queryClient)
      queryClient.setQueryData(sessionKeys.session, null)
      toast.success('Você saiu da sua conta.')
      await router.invalidate()
    },
  })
}
