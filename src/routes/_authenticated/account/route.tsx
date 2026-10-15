import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AccountShell } from '@/features/account/account-shell'

export const Route = createFileRoute('/_authenticated/account')({
  component: AccountLayout,
})

function AccountLayout() {
  return (
    <AccountShell>
      <Outlet />
    </AccountShell>
  )
}
