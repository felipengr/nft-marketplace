import { Link, useRouterState } from '@tanstack/react-router'
import { SearchIcon } from '@/components/icons/brand-icons'
import { Button } from '@/components/ui/button'
import { CATALOG_SECTION_ID } from '@/features/catalog/catalog-search'
import { notifyComingSoon } from '@/lib/coming-soon'
import { cn } from '@/lib/utils'
import { AccountMenu } from './account-menu'
import { CartLink } from './cart-link'
import { SearchDialog } from './search-dialog'

const NAV_ITEM_CLASS =
  'relative inline-flex h-full items-center text-[0.95rem] tracking-wide text-foreground transition-colors hover:text-primary'

const ACTIVE_CLASS =
  'text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:rounded-full after:bg-primary'

function useActiveSection(): 'home' | 'market' | null {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/nfts')) return 'market'
  return null
}

export function SiteHeader() {
  const active = useActiveSection()

  return (
    <header className="hidden md:block">
      <div className="container-page">
        <div className="flex h-[4.6875rem] items-center justify-between gap-6 border-b border-border">
          <Link to="/" className="text-sm font-bold tracking-[0.2em] text-foreground" aria-label="Kurio, página inicial">
            KURIO
          </Link>

          <nav aria-label="Principal" className="h-full">
            <ul className="flex h-full items-center gap-6 lg:gap-10">
              <li className="h-full">
                <Link
                  to="/"
                  aria-current={active === 'home' ? 'page' : undefined}
                  className={cn(NAV_ITEM_CLASS, active === 'home' && ACTIVE_CLASS)}
                >
                  Início
                </Link>
              </li>
              <li className="h-full">
                <Link
                  to="/"
                  hash={CATALOG_SECTION_ID}
                  aria-current={active === 'market' ? 'page' : undefined}
                  className={cn(NAV_ITEM_CLASS, active === 'market' && ACTIVE_CLASS)}
                >
                  Mercado
                </Link>
              </li>
              <li className="h-full">
                <button type="button" className={NAV_ITEM_CLASS} onClick={() => notifyComingSoon('A página de criadores')}>
                  Criadores
                </button>
              </li>
              <li className="h-full">
                <button type="button" className={NAV_ITEM_CLASS} onClick={() => notifyComingSoon('A área Aprenda')}>
                  Aprenda
                </button>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-4 lg:gap-6">
            <SearchDialog
              trigger={
                <Button variant="ghost" size="icon" aria-label="Buscar NFTs" className="text-foreground hover:text-primary">
                  <SearchIcon className="size-[1.375rem]" />
                </Button>
              }
            />
            <CartLink
              className="flex size-9 items-center justify-center rounded-sm text-foreground transition-colors hover:text-primary"
              iconClassName="size-5.5"
            />
            <AccountMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
