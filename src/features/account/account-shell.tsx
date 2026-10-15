import { Link, useRouterState } from '@tanstack/react-router'
import { ChartLine, Download, Heart, LogOut, MapPin, ShoppingCart, TriangleAlert, UserRound, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLogout } from '@/features/auth/use-session'
import { notifyComingSoon } from '@/lib/coming-soon'
import { cn } from '@/lib/utils'

type NavItem = { label: string; icon: LucideIcon } & ({ to: '/account' | '/account/wallets' | '/favorites' } | { soon: string })

const ITEMS: NavItem[] = [
  { label: 'Dados do perfil', icon: UserRound, to: '/account' },
  { label: 'Carteiras', icon: MapPin, to: '/account/wallets' },
  { label: 'Atividade', icon: ShoppingCart, soon: 'A atividade da conta' },
  { label: 'Lista de interesse', icon: Heart, to: '/favorites' },
  { label: 'Ofertas', icon: ChartLine, soon: 'As ofertas' },
  { label: 'Arquivos baixados', icon: Download, soon: 'Os arquivos baixados' },
  { label: 'Suporte', icon: TriangleAlert, soon: 'O suporte' },
]

const ITEM_CLASS =
  'relative flex shrink-0 items-center gap-3 rounded-sm px-3 py-2.5 text-[0.95rem] tracking-wide whitespace-nowrap text-primary/90 transition-colors hover:bg-secondary/60 hover:text-primary md:rounded-none md:px-4'

const ACTIVE_CLASS = 'bg-secondary/60 font-semibold text-primary md:bg-transparent md:before:absolute md:before:inset-y-0 md:before:left-0 md:before:w-1.5 md:before:bg-primary'

export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const logout = useLogout()

  return (
    <div className="container-page grid grid-cols-[minmax(0,1fr)] gap-6 py-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-7 md:py-8 lg:grid-cols-[19.375rem_minmax(0,1fr)]">
      <aside className="md:self-start md:bg-surface">
        <h2 className="mb-3 text-lg font-bold md:mb-1 md:px-2.5 md:pt-4">Meu perfil</h2>
        <nav aria-label="Menu do perfil">
          <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:block md:overflow-visible md:px-0 md:pb-0">
            {ITEMS.map((item) => {
              const Icon = item.icon
              const content = (
                <>
                  <Icon className="size-4.5" aria-hidden />
                  {item.label}
                </>
              )
              return (
                <li key={item.label}>
                  {'to' in item ? (
                    <Link
                      to={item.to}
                      aria-current={pathname === item.to ? 'page' : undefined}
                      className={cn(ITEM_CLASS, pathname === item.to && ACTIVE_CLASS)}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button type="button" className={ITEM_CLASS} onClick={() => notifyComingSoon(item.soon)}>
                      {content}
                    </button>
                  )}
                </li>
              )
            })}
            <li className="md:mt-1 md:border-t md:border-secondary">
              <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className={cn(ITEM_CLASS, 'font-bold text-foreground md:py-3.5')}
              >
                <LogOut className="size-4.5" aria-hidden />
                Sair
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
