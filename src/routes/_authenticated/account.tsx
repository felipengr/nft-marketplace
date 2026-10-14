import { createFileRoute } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLogout, useSession } from '@/features/auth/use-session'

export const Route = createFileRoute('/_authenticated/account')({
  head: () => ({ meta: [{ title: 'Minha conta — Kurio' }] }),
  component: AccountPage,
})

function AccountPage() {
  const { user } = useSession()
  const logout = useLogout()

  if (!user) return null

  return (
    <section aria-labelledby="account-title" className="container-page py-10 md:py-16">
      <h1 id="account-title" className="mb-6 text-2xl font-bold">
        Minha conta
      </h1>
      <dl className="mb-8 max-w-md space-y-3 rounded-sm bg-surface p-6 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-subtle">Nome de exibição</dt>
          <dd>{user.displayName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-subtle">Nome de usuário</dt>
          <dd>@{user.username}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-subtle">E-mail</dt>
          <dd>{user.email}</dd>
        </div>
      </dl>
      <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
        <LogOut aria-hidden />
        Sair
      </Button>
    </section>
  )
}
