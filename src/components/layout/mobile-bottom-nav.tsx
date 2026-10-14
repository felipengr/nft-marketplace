import { Link, useRouterState } from '@tanstack/react-router'
import { Heart, House, ScanSearch } from 'lucide-react'
import type { ReactNode } from 'react'
import { ShopIcon, UserIcon } from '@/components/icons/brand-icons'
import { notifyComingSoon } from '@/lib/coming-soon'
import { cn } from '@/lib/utils'
import { SearchDialog } from './search-dialog'

const ITEM_CLASS =
  'flex size-11 items-center justify-center rounded-full text-subtle transition-colors hover:text-primary aria-[current=page]:text-primary'

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={ITEM_CLASS}>
      {children}
    </button>
  )
}

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-center justify-items-center px-2">
        <li>
          <Link to="/" aria-label="Início" aria-current={pathname === '/' ? 'page' : undefined} className={ITEM_CLASS}>
            <House className="size-5" aria-hidden />
          </Link>
        </li>
        <li>
          <NavButton label="Favoritos" onClick={() => notifyComingSoon('A lista de favoritos')}>
            <Heart className="size-5" aria-hidden />
          </NavButton>
        </li>
        <li>
          <SearchDialog
            trigger={
              <button
                type="button"
                aria-label="Buscar NFTs"
                className={cn(
                  '-mt-8 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/40',
                  'ring-4 ring-background transition-transform hover:scale-105',
                )}
              >
                <ScanSearch className="size-7" aria-hidden />
              </button>
            }
          />
        </li>
        <li>
          <NavButton label="Carrinho" onClick={() => notifyComingSoon('O carrinho')}>
            <ShopIcon className="size-5" />
          </NavButton>
        </li>
        <li>
          <NavButton label="Minha conta" onClick={() => notifyComingSoon('A área da conta')}>
            <UserIcon className="size-5" />
          </NavButton>
        </li>
      </ul>
    </nav>
  )
}
