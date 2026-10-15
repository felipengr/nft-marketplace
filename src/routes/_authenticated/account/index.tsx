import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/features/account/profile-page'

export const Route = createFileRoute('/_authenticated/account/')({
  head: () => ({ meta: [{ title: 'Meu perfil — Kurio' }] }),
  component: ProfilePage,
})
