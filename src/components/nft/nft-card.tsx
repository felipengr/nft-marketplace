import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import type { NftSummary } from '@/api/contracts/nft'
import { SearchIcon, ShopIcon } from '@/components/icons/brand-icons'
import { Skeleton } from '@/components/ui/skeleton'
import { useNftActions } from '@/features/nft-detail/use-nft-actions'
import { cn } from '@/lib/utils'
import { NftImage } from './nft-image'
import { NftPrice } from './nft-price'

type NftCardProps = {
  nft: NftSummary
  priority?: boolean
  sizes?: string
  className?: string
}

const DEFAULT_SIZES = '(min-width: 1024px) 250px, (min-width: 768px) 30vw, 45vw'

const FRAME_CLASS = 'relative rounded-[1.25rem] bg-surface p-2 md:rounded-sm md:px-1 md:py-5'

const IMAGE_CLASS = 'aspect-square overflow-hidden rounded-2xl'

const ACTION_CLASS =
  'relative z-10 flex size-9 items-center justify-center rounded-sm bg-background/90 text-foreground transition-colors hover:text-primary'

export function NftCard({ nft, priority = false, sizes = DEFAULT_SIZES, className }: NftCardProps) {
  const soldOut = nft.available === 0
  const { toggleFavorite, addToCart } = useNftActions()

  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className={cn(FRAME_CLASS, 'transition-colors md:group-hover:bg-secondary')}>
        <div className={IMAGE_CLASS}>
          <NftImage
            image={nft.image}
            sizes={sizes}
            priority={priority}
            className="transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
        {nft.badge ? (
          <span className="absolute top-2 left-2 rounded-tl-2xl bg-primary px-3 py-1 text-xs font-bold tracking-wider text-primary-foreground sm:text-sm md:top-0 md:left-0 md:rounded-none md:px-2">
            {nft.badge}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => toggleFavorite(nft.id)}
          aria-label={`Favoritar ${nft.name}`}
          className="absolute top-4 right-4 z-10 flex size-8 items-center justify-center rounded-full bg-background/85 text-primary md:hidden"
        >
          <Heart className="size-4" aria-hidden />
        </button>
        <div className="absolute inset-x-0 bottom-8 z-10 hidden justify-center gap-3 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 md:flex">
          <button
            type="button"
            onClick={() => addToCart({ nftId: nft.id, quantity: 1 })}
            disabled={soldOut}
            aria-label={`Adicionar ${nft.name} ao carrinho`}
            className={cn(ACTION_CLASS, 'disabled:cursor-not-allowed disabled:opacity-50')}
          >
            <ShopIcon className="size-5" />
          </button>
          <button type="button" onClick={() => toggleFavorite(nft.id)} aria-label={`Favoritar ${nft.name}`} className={ACTION_CLASS}>
            <Heart className="size-5" aria-hidden />
          </button>
          <Link to="/nfts/$nftId" params={{ nftId: nft.id }} aria-label={`Ver detalhes de ${nft.name}`} className={ACTION_CLASS}>
            <SearchIcon className="size-5" />
          </Link>
        </div>
      </div>
      <h3 className="mt-3 truncate text-sm tracking-wide sm:text-base">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          className="after:absolute after:inset-0 after:rounded-sm focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
        >
          {nft.name}
        </Link>
      </h3>
      <NftPrice price={nft.price} previousPrice={nft.previousPrice} className="text-base sm:text-lg" />
      {soldOut ? <p className="text-xs font-semibold tracking-wider text-muted-foreground">ESGOTADO</p> : null}
    </article>
  )
}

export function NftCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className={FRAME_CLASS}>
        <Skeleton className={cn(IMAGE_CLASS, 'bg-secondary')} />
      </div>
      <Skeleton className="mt-3 h-5 w-3/4" />
      <Skeleton className="mt-2 h-6 w-1/3" />
    </div>
  )
}
