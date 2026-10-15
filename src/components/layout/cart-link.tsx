import { Link } from '@tanstack/react-router'
import { ShopIcon } from '@/components/icons/brand-icons'
import { useCart } from '@/features/cart/use-cart'
import { cn } from '@/lib/utils'

export function CartLink({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  const { data } = useCart()
  const count = data?.itemCount ?? 0
  const label = count ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho'

  return (
    <Link to="/cart" aria-label={label} className={cn('relative', className)}>
      <ShopIcon className={iconClassName} />
      {count ? (
        <span
          aria-hidden
          className="absolute top-0.5 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] leading-none font-bold text-primary-foreground tabular-nums"
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  )
}
