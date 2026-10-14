import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { loginInputSchema, type LoginInput } from '@/api/contracts/session'
import { FormAlert, PasswordField, TextField } from '@/components/form/form-field'
import { Button } from '@/components/ui/button'
import { notifyComingSoon } from '@/lib/coming-soon'
import { cn } from '@/lib/utils'
import { applyServerErrors } from './apply-server-errors'
import { useLogin } from './use-session'

type LoginFormProps = {
  onSuccess: () => void
  size?: 'default' | 'lg'
}

export function LoginForm({ onSuccess, size = 'default' }: LoginFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const loginMutation = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginInputSchema), defaultValues: { email: '', password: '' } })

  const fieldClass = size === 'lg' ? 'h-12 rounded-xl' : undefined

  const onSubmit = handleSubmit((values) => {
    if (loginMutation.isPending) return
    setFormError(null)
    loginMutation.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onSuccess,
        onError: (error) => setFormError(applyServerErrors<LoginInput>(error, ['email', 'password'], setError)),
      },
    )
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        inputClassName={fieldClass}
        error={errors.email?.message}
        {...register('email')}
      />
      <div>
        <PasswordField
          label="Senha"
          autoComplete="current-password"
          placeholder="Senha"
          inputClassName={fieldClass}
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            className="text-sm tracking-wide text-primary underline-offset-4 hover:underline"
            onClick={() => notifyComingSoon('A recuperação de senha')}
          >
            Esqueceu a senha?
          </button>
        </div>
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={loginMutation.isPending}
        aria-busy={loginMutation.isPending}
        className={cn('w-full text-base font-bold', size === 'lg' ? 'h-14 rounded-xl' : 'h-11')}
      >
        {loginMutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {loginMutation.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
