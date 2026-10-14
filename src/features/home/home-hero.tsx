import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import type { NftSummary } from '@/api/contracts/nft'
import { NftImage } from '@/components/nft/nft-image'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CATALOG_SECTION_ID } from '@/features/catalog/catalog-search'
import { cn } from '@/lib/utils'
import { featuredQueryOptions } from '@/queries/nft-queries'

function HeroDots({ items, active, onSelect, className }: { items: NftSummary[]; active: number; onSelect: (index: number) => void; className?: string }) {
  if (items.length < 2) return null
  return (
    <div role="group" aria-label="Destaques" className={cn('flex items-center gap-2', className)}>
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          aria-label={`Mostrar destaque ${index + 1} de ${items.length}: ${item.name}`}
          aria-pressed={index === active}
          onClick={() => onSelect(index)}
          className="flex size-6 items-center justify-center rounded-full"
        >
          <span className={cn('size-2 rounded-full transition-colors', index === active ? 'bg-primary' : 'bg-primary/40')} />
        </button>
      ))}
    </div>
  )
}

function HeroArtwork({ nft, className, sizes }: { nft: NftSummary; className?: string; sizes: string }) {
  return (
    <Link to="/nfts/$nftId" params={{ nftId: nft.id }} className={cn('block overflow-hidden', className)} aria-label={`Ver ${nft.name}`}>
      <NftImage image={nft.image} sizes={sizes} priority className="transition-transform duration-500 hover:scale-[1.02]" />
    </Link>
  )
}

export function HomeHero() {
  const { data, isPending } = useQuery(featuredQueryOptions())
  const [active, setActive] = useState(0)
  const items = data?.hero ?? []
  const current = items[active] ?? items[0]
  const next = items.length > 1 ? items[(active + 1) % items.length] : undefined

  return (
    <section aria-labelledby="hero-title" className="container-page pt-4 md:pt-8">
      <div className="hidden min-h-[28.125rem] grid-cols-[minmax(0,1fr)_minmax(0,20rem)] items-center gap-8 md:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,28.125rem)]">
        <div className="relative flex h-full flex-col justify-center lg:pl-10">
          <p className="mb-5 text-sm tracking-[0.08em]">Bem-vindo à Kurio</p>
          <h1 id="hero-title" className="mb-5 text-[1.75rem] leading-[1.6] font-bold tracking-[0.02em] lg:text-[2.75rem]">
            SEJA DONO DO FUTURO
            <br />
            DA ARTE DIGITAL
          </h1>
          <p className="mb-8 max-w-[34.5rem] text-sm leading-6 text-subtle">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma
            parte da cultura da internet.
          </p>
          <Button asChild size="lg" className="w-fit px-7 font-bold">
            <Link to="/" hash={CATALOG_SECTION_ID}>
              EXPLORAR
            </Link>
          </Button>
          <HeroDots items={items} active={active} onSelect={setActive} className="absolute right-0 bottom-6" />
        </div>
        {isPending || !current ? (
          <Skeleton className="aspect-square rounded-3xl" />
        ) : (
          <HeroArtwork nft={current} sizes="(min-width: 1024px) 450px, 320px" className="aspect-square rounded-3xl" />
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-[#5b3b22] via-[#3a2416] to-surface p-4 md:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_8.75rem] gap-3">
          <div className="relative z-10">
            <p className="mb-2 text-xs">Bem-vindo à Kurio</p>
            <h1 className="mb-2 text-lg leading-[1.6] font-bold tracking-wide">
              SEJA DONO DA
              <br />
              CULTURA DIGITAL
            </h1>
            <p className="mb-2 text-xs leading-5 text-subtle">Descubra NFTs selecionados de criadores do mundo todo.</p>
            <Link to="/" hash={CATALOG_SECTION_ID} className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-primary">
              EXPLORAR
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="relative">
            {isPending || !current ? (
              <Skeleton className="aspect-square rounded-xl" />
            ) : (
              <HeroArtwork nft={current} sizes="140px" className="aspect-square rounded-xl" />
            )}
            {next ? (
              <div className="absolute -bottom-3 -left-4 size-14 overflow-hidden rounded-lg border-2 border-surface" aria-hidden>
                <NftImage image={next.image} sizes="56px" decorative />
              </div>
            ) : null}
          </div>
        </div>
        <HeroDots items={items} active={active} onSelect={setActive} className="mt-3 justify-center" />
      </div>
    </section>
  )
}
