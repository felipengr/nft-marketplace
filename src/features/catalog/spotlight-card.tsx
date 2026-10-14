import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { NftImage } from '@/components/nft/nft-image'
import { NftPrice } from '@/components/nft/nft-price'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { featuredQueryOptions } from '@/queries/nft-queries'

export function SpotlightCard({ className }: { className?: string }) {
  const { data, isPending, isError } = useQuery(featuredQueryOptions())

  if (isError) return null

  if (isPending) {
    return (
      <div className={cn('overflow-hidden rounded-2xl bg-surface', className)} aria-hidden>
        <div className="space-y-3 p-5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mx-auto h-6 w-40" />
        </div>
        <Skeleton className="aspect-[310/366] rounded-2xl" />
      </div>
    )
  }

  const spotlight = data.spotlight

  return (
    <section
      aria-labelledby="spotlight-title"
      className={cn('group relative overflow-hidden rounded-2xl bg-linear-to-b from-secondary/70 to-surface', className)}
    >
      <div className="px-5 pt-6 pb-3">
        <h2 id="spotlight-title" className="text-xl font-bold tracking-wide text-primary lg:text-2xl">
          {spotlight.headline}
        </h2>
        <p className="mt-2 text-center text-lg font-bold tracking-wide lg:text-xl">{spotlight.tagline}</p>
      </div>
      <div className="relative aspect-[310/366] overflow-hidden rounded-2xl">
        <NftImage
          image={spotlight.image}
          sizes="(min-width: 1024px) 310px, (min-width: 768px) 240px, 90vw"
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-background/95 via-background/70 to-transparent px-4 pt-10 pb-4">
          <p className="truncate text-base tracking-wide">
            <Link
              to="/nfts/$nftId"
              params={{ nftId: spotlight.id }}
              className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring"
            >
              {spotlight.name}
            </Link>
          </p>
          <NftPrice price={spotlight.price} previousPrice={spotlight.previousPrice} />
        </div>
      </div>
    </section>
  )
}
