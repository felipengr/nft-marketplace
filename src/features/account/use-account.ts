import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChangePasswordInput, Profile, UpdateProfileInput } from '@/api/contracts/profile'
import type { Session } from '@/api/contracts/session'
import type { UpsertWalletInput, WalletKind } from '@/api/contracts/wallet'
import { changePassword, fetchProfile, removeAvatar, updateAvatar, updateProfile } from '@/api/profile'
import { deleteWallet, saveWallet } from '@/api/wallets'
import { useSession } from '@/features/auth/use-session'
import { checkoutKeys } from '@/queries/checkout-queries'
import { privateKeys, sessionKeys } from '@/queries/session-queries'

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: [...privateKeys.user(userId), 'profile'] as const,
    queryFn: ({ signal }) => fetchProfile(signal),
    staleTime: 60_000,
  })
}

export function useProfile() {
  const { user } = useSession()
  return useQuery({ ...profileQueryOptions(user?.id ?? 'anonymous'), enabled: Boolean(user) })
}

function useApplyProfile() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return (profile: Profile) => {
    if (!user) return
    queryClient.setQueryData(profileQueryOptions(user.id).queryKey, profile)
    queryClient.setQueryData<Session | null>(sessionKeys.session, (session) =>
      session
        ? {
            ...session,
            user: {
              ...session.user,
              displayName: profile.displayName,
              username: profile.username,
              email: profile.email,
              ensName: profile.ensName,
              avatarUrl: profile.avatarUrl,
            },
          }
        : session,
    )
  }
}

export function useUpdateProfile() {
  const applyProfile = useApplyProfile()
  return useMutation({ mutationFn: (input: UpdateProfileInput) => updateProfile(input), onSuccess: applyProfile })
}

export function useUpdateAvatar() {
  const applyProfile = useApplyProfile()
  return useMutation({ mutationFn: (dataUrl: string) => updateAvatar(dataUrl), onSuccess: applyProfile })
}

export function useRemoveAvatar() {
  const applyProfile = useApplyProfile()
  return useMutation({ mutationFn: () => removeAvatar(), onSuccess: applyProfile })
}

export function useChangePassword() {
  return useMutation({ mutationFn: (input: ChangePasswordInput) => changePassword(input) })
}

function useInvalidateWallets() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return () => {
    if (user) void queryClient.invalidateQueries({ queryKey: checkoutKeys.wallets(user.id) })
  }
}

export function useSaveWallet(kind: WalletKind) {
  const invalidate = useInvalidateWallets()
  return useMutation({ mutationFn: (input: UpsertWalletInput) => saveWallet(kind, input), onSuccess: invalidate })
}

export function useDeleteWallet() {
  const invalidate = useInvalidateWallets()
  return useMutation({ mutationFn: (kind: WalletKind) => deleteWallet(kind), onSuccess: invalidate })
}
