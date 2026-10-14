import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { registerInputSchema, type RegisterInput } from '@/api/contracts/session'
import { FormAlert, PasswordField, TextField } from '@/components/form/form-field'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { applyServerErrors } from './apply-server-errors'
import { useRegister } from './use-session'

type RegisterFormProps = {
  onSuccess: () => void
  size?: 'default' | 'lg'
  submitLabel?: string
}

const FIELDS = ['username', 'email', 'password', 'confirmPassword'] as const

export function RegisterForm({ onSuccess, size = 'default', submitLabel = 'Criar conta' }: RegisterFormProps) {
  const [formError, setFormError] = useState<string | null>(null)
  const registerMutation = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerInputSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  const fieldClass = size === 'lg' ? 'h-12 rounded-xl' : undefined

  const onSubmit = handleSubmit((values) => {
    if (registerMutation.isPending) return
    setFormError(null)
    registerMutation.mutate(
      { ...values, username: values.username.trim().toLowerCase(), email: values.email.trim() },
      {
        onSuccess,
        onError: (error) => setFormError(applyServerErrors<RegisterInput>(error, FIELDS, setError)),
      },
    )
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <TextField
        label="Nome de usuário"
        autoComplete="username"
        placeholder="Nome de usuário"
        inputClassName={fieldClass}
        error={errors.username?.message}
        {...register('username')}
      />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="Digite seu e-mail"
        inputClassName={fieldClass}
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordField
        label="Senha"
        autoComplete="new-password"
        placeholder="Senha"
        inputClassName={fieldClass}
        error={errors.password?.message}
        {...register('password')}
      />
      <PasswordField
        label="Confirmar senha"
        autoComplete="new-password"
        placeholder="Confirmar senha"
        inputClassName={fieldClass}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <p className="text-xs text-subtle">A senha deve ter pelo menos 8 caracteres, com letras e números.</p>
      <Button
        type="submit"
        size="lg"
        disabled={registerMutation.isPending}
        aria-busy={registerMutation.isPending}
        className={cn('w-full text-base font-bold', size === 'lg' ? 'h-14 rounded-xl' : 'h-11')}
      >
        {registerMutation.isPending ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        {registerMutation.isPending ? 'Criando…' : submitLabel}
      </Button>
    </form>
  )
}
