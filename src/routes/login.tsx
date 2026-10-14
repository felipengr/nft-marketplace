import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { AuthPage } from '@/features/auth/auth-page'
import { authSearchSchema, redirectIfAuthenticated } from '@/features/auth/auth-search'
import { LoginForm } from '@/features/auth/login-form'
import { safeRedirect } from '@/lib/safe-redirect'

export const Route = createFileRoute('/login')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ context, search }) => redirectIfAuthenticated(context.queryClient, search),
  staticData: { mobileNav: false, mobileFooter: false },
  head: () => ({ meta: [{ title: 'Entrar — Kurio' }] }),
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  const router = useRouter()

  return (
    <AuthPage
      title="Entrar"
      description="Entre para gerenciar sua carteira, coleção e perfil de criador."
      notice={search.reason === 'expired' ? 'Sua sessão expirou. Entre novamente para continuar de onde parou.' : undefined}
      footer={
        <>
          Novo na Kurio?{' '}
          <Link to="/register" search={{ redirect: search.redirect }} className="font-semibold text-primary underline-offset-4 hover:underline">
            Crie uma conta
          </Link>
        </>
      }
    >
      <LoginForm size="lg" onSuccess={() => void router.navigate({ href: safeRedirect(search.redirect), replace: true })} />
    </AuthPage>
  )
}
