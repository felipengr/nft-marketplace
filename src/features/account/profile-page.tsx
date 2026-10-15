import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { changePasswordInputSchema, updateProfileInputSchema, type Profile } from '@/api/contracts/profile'
import { ErrorState } from '@/components/feedback/query-states'
import { EnsField, FormAlert, PasswordField, TextField } from '@/components/form/form-field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { applyServerErrors } from '@/features/auth/apply-server-errors'
import { AvatarEditor } from './avatar-editor'
import { useChangePassword, useProfile, useUpdateProfile } from './use-account'

const profileFormSchema = updateProfileInputSchema
  .extend({
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    const { currentPassword, newPassword, confirmPassword } = values
    if (!currentPassword && !newPassword && !confirmPassword) return
    const result = changePasswordInputSchema.safeParse({ currentPassword, newPassword, confirmPassword })
    if (result.success) return
    for (const issue of result.error.issues) context.addIssue({ code: 'custom', path: issue.path, message: issue.message })
  })

type ProfileFormValues = z.input<typeof profileFormSchema>

const PROFILE_FIELDS = ['displayName', 'username', 'email', 'ensName', 'nickname'] as const

const PASSWORD_FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const

function ProfileForm({ profile }: { profile: Profile }) {
  const [formError, setFormError] = useState<string | null>(null)
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const busy = updateProfile.isPending || changePassword.isPending
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: profile.displayName,
      username: profile.username,
      email: profile.email,
      ensName: profile.ensName ?? '',
      nickname: profile.nickname ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return
    setFormError(null)
    const { currentPassword, newPassword, confirmPassword, ...profileInput } = values
    try {
      await updateProfile.mutateAsync(updateProfileInputSchema.parse(profileInput))
    } catch (error) {
      setFormError(applyServerErrors<ProfileFormValues>(error, PROFILE_FIELDS, setError))
      return
    }
    if (!currentPassword) {
      toast.success('Perfil atualizado.')
      return
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword, confirmPassword })
      PASSWORD_FIELDS.forEach((field) => resetField(field))
      toast.success('Perfil e senha atualizados.')
    } catch (error) {
      toast.success('Perfil atualizado.')
      setFormError(applyServerErrors<ProfileFormValues>(error, PASSWORD_FIELDS, setError))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <FormAlert message={formError} />
      <section aria-labelledby="profile-title" className="space-y-5">
        <h1 id="profile-title" className="text-lg font-bold">
          Perfil do colecionador
        </h1>
        <div className="grid gap-x-7 gap-y-5 sm:grid-cols-2">
          <TextField label="Nome de exibição" hideLabel={false} requiredMark autoComplete="name" error={errors.displayName?.message} {...register('displayName')} />
          <TextField label="Nome de usuário" hideLabel={false} requiredMark autoComplete="username" error={errors.username?.message} {...register('username')} />
          <TextField label="E-mail" type="email" hideLabel={false} requiredMark autoComplete="email" error={errors.email?.message} {...register('email')} />
          <EnsField label="Nome ENS" requiredMark error={errors.ensName?.message} {...register('ensName')} />
          <TextField label="Apelido da carteira" hideLabel={false} requiredMark autoComplete="off" error={errors.nickname?.message} {...register('nickname')} />
          <AvatarEditor avatarUrl={profile.avatarUrl} name={profile.displayName} />
        </div>
      </section>

      <section aria-labelledby="password-title" className="max-w-[26rem] space-y-5">
        <div>
          <h2 id="password-title" className="text-lg font-bold">
            Alterar senha
          </h2>
          <p className="text-xs text-subtle">Preencha apenas se quiser trocar sua senha. Mínimo de 8 caracteres, com letras e números.</p>
        </div>
        <PasswordField label="Senha atual" hideLabel={false} autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <PasswordField label="Nova senha" hideLabel={false} autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
        <PasswordField label="Confirmar nova senha" hideLabel={false} autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      </section>

      <Button type="submit" size="lg" className="h-10 w-32 font-bold" disabled={busy} aria-busy={busy}>
        {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        Salvar
      </Button>
    </form>
  )
}

export function ProfilePage() {
  const { data, error, isPending, isError, isFetching, refetch } = useProfile()

  if (isPending) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Carregando perfil">
        <Skeleton className="h-6 w-56" />
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return <ErrorState title="Não foi possível carregar seu perfil" error={error} onRetry={() => void refetch()} retrying={isFetching} />
  }

  return <ProfileForm key={data.id} profile={data} />
}
