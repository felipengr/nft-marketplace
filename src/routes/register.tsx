import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { AuthPage } from '@/features/auth/auth-page'
import { authSearchSchema, redirectIfAuthenticated } from '@/features/auth/auth-search'
import { RegisterForm } from '@/features/auth/register-form'
import { safeRedirect } from '@/lib/safe-redirect'

export const Route = createFileRoute('/register')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ context, search }) => redirectIfAuthenticated(context.queryClient, search),
  staticData: { mobileNav: false, mobileFooter: false },
  head: () => ({ meta: [{ title: 'Criar conta — Kurio' }] }),
  component: RegisterPage,
})

function RegisterPage() {
  const search = Route.useSearch()
  const router = useRouter()

  return (
    <AuthPage
      title="Criar perfil de colecionador"
      description="Crie seu perfil de colecionador e conecte uma carteira quando quiser."
      footer={
        <>
          Já tem uma conta?{' '}
          <Link to="/login" search={{ redirect: search.redirect }} className="font-semibold text-primary underline-offset-4 hover:underline">
            Entre
          </Link>
        </>
      }
    >
      <RegisterForm
        size="lg"
        submitLabel="Criar perfil"
        onSuccess={() => void router.navigate({ href: safeRedirect(search.redirect), replace: true })}
      />
    </AuthPage>
  )
}
