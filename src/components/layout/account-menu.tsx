import { Link } from '@tanstack/react-router'
import { Heart, LogIn, LogOut, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthPrompt } from '@/features/auth/auth-prompt'
import { useLogout, useSession } from '@/features/auth/use-session'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AccountMenu() {
  const { user, isLoading } = useSession()
  const openAuth = useAuthPrompt()
  const logout = useLogout()

  if (isLoading) return <Skeleton className="h-9 w-24" />

  if (!user) {
    return (
      <Button onClick={() => openAuth('login')}>
        <LogIn aria-hidden />
        Entrar
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Menu da conta de ${user.displayName}`}
          className="flex items-center gap-2 rounded-sm border border-primary px-2 py-1 text-sm hover:bg-primary/10"
        >
          <span aria-hidden className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="size-full object-cover" /> : initials(user.displayName)}
          </span>
          <span className="max-w-32 truncate">{user.displayName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48 border border-border bg-surface">
        <DropdownMenuLabel className="text-xs font-normal text-subtle">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account">
            <UserRound aria-hidden />
            Minha conta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/favorites">
            <Heart aria-hidden />
            Lista de interesse
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut aria-hidden />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
