import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/api/contracts/nft'
import { Skeleton } from '@/components/ui/skeleton'
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

export function NftCard({ nft, priority = false, sizes = DEFAULT_SIZES, className }: NftCardProps) {
  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className="relative rounded-sm bg-surface px-1 py-5 transition-colors group-hover:bg-secondary">
        <div className="aspect-square overflow-hidden rounded-2xl">
          <NftImage
            image={nft.image}
            sizes={sizes}
            priority={priority}
            className="transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
        {nft.badge ? (
          <span className="absolute top-0 left-0 bg-primary px-2 py-1 text-xs font-bold tracking-wider text-primary-foreground sm:text-sm">
            {nft.badge}
          </span>
        ) : null}
      </div>
      <h3 className="mt-3 truncate text-base tracking-wide">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          className="after:absolute after:inset-0 after:rounded-sm focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
        >
          {nft.name}
        </Link>
      </h3>
      <NftPrice price={nft.price} previousPrice={nft.previousPrice} />
      {nft.available === 0 ? <p className="text-xs font-semibold tracking-wider text-muted-foreground">ESGOTADO</p> : null}
    </article>
  )
}

export function NftCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="rounded-sm bg-surface px-1 py-5">
        <Skeleton className="aspect-square rounded-2xl bg-secondary" />
      </div>
      <Skeleton className="mt-3 h-5 w-3/4" />
      <Skeleton className="mt-2 h-6 w-1/3" />
    </div>
  )
}
