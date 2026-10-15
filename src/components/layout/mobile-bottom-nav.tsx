import { Link, useRouterState } from '@tanstack/react-router'
import { ScanLine } from 'lucide-react'
import { HeartFilledIcon, HomeFilledIcon, UserIcon } from '@/components/icons/brand-icons'
import { useSession } from '@/features/auth/use-session'
import { CartLink } from './cart-link'
import { SearchDialog } from './search-dialog'

const ITEM_CLASS =
  'flex size-11 items-center justify-center rounded-full text-subtle transition-colors hover:text-primary aria-[current=page]:text-primary'

const NOTCH_MASK = 'radial-gradient(circle 2.6rem at 50% 0, transparent 98%, #000 100%)'

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const href = useRouterState({ select: (state) => state.location.href })
  const { user } = useSession()

  return (
    <nav aria-label="Navegação inferior" className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div
        className="rounded-t-[2rem] bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(0_0_0/0.35)]"
        style={{ maskImage: NOTCH_MASK, WebkitMaskImage: NOTCH_MASK }}
      >
        <ul className="mx-auto grid h-18 max-w-md grid-cols-[1fr_1fr_5.5rem_1fr_1fr] items-center justify-items-center px-4">
          <li>
            <Link to="/" aria-label="Início" aria-current={pathname === '/' ? 'page' : undefined} className={ITEM_CLASS}>
              <HomeFilledIcon className="size-6" />
            </Link>
          </li>
          <li>
            <Link
              to={user ? '/favorites' : '/login'}
              search={user ? undefined : { redirect: '/favorites' }}
              aria-label="Favoritos"
              aria-current={pathname === '/favorites' ? 'page' : undefined}
              className={ITEM_CLASS}
            >
              <HeartFilledIcon className="size-6" />
            </Link>
          </li>
          <li aria-hidden />
          <li>
            <CartLink className={ITEM_CLASS} iconClassName="size-5.5" />
          </li>
          <li>
            <Link
              to={user ? '/account' : '/login'}
              search={user ? undefined : { redirect: href }}
              aria-label={user ? 'Minha conta' : 'Entrar'}
              aria-current={pathname === '/account' ? 'page' : undefined}
              className={ITEM_CLASS}
            >
              <UserIcon className="size-5.5" />
            </Link>
          </li>
        </ul>
      </div>
      <div className="absolute -top-8 left-1/2 -translate-x-1/2">
        <SearchDialog
          trigger={
            <button
              type="button"
              aria-label="Buscar NFTs"
              className="flex size-16 items-center justify-center rounded-full bg-linear-to-br from-[#e2a46c] to-[#b9733a] text-foreground shadow-lg shadow-black/40 transition-transform hover:scale-105"
            >
              <ScanLine className="size-7" strokeWidth={1.6} aria-hidden />
            </button>
          }
        />
      </div>
    </nav>
  )
}
