import { useState } from 'react'
import type { Image } from '@/api/contracts/common'
import { SearchIcon } from '@/components/icons/brand-icons'
import { NftImage } from '@/components/nft/nft-image'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type NftGalleryProps = {
  name: string
  images: Image[]
}

export function NftGallery({ name, images }: NftGalleryProps) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]

  return (
    <div className="hidden grid-cols-[6.25rem_minmax(0,1fr)] gap-7 md:grid">
      <ul aria-label="Imagens do NFT" className="flex flex-col gap-4">
        {images.map((image, index) => (
          <li key={`${image.url}-${index}`}>
            <button
              type="button"
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
              className={cn(
                'block aspect-square w-full overflow-hidden rounded-sm border-2 transition-colors',
                index === active ? 'border-primary' : 'border-transparent hover:border-primary/50',
              )}
            >
              <NftImage image={image} sizes="100px" decorative priority={index === 0} />
            </button>
          </li>
        ))}
      </ul>
      <div className="relative self-start rounded-sm bg-surface p-5">
        <div className="aspect-square overflow-hidden rounded-2xl">
          <NftImage image={current} sizes="(min-width: 1024px) 404px, 30vw" priority />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button
              type="button"
              aria-label="Ampliar imagem"
              className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors hover:text-primary"
            >
              <SearchIcon className="size-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[min(90vw,52rem)] border-border bg-surface p-3 sm:max-w-[min(90vw,52rem)]">
            <DialogTitle className="sr-only">{name}</DialogTitle>
            <DialogDescription className="sr-only">Imagem ampliada do NFT.</DialogDescription>
            <div className="aspect-square overflow-hidden rounded-xl">
              <NftImage image={current} sizes="(min-width: 900px) 52rem, 90vw" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export function MobileNftGallery({ images }: { images: Image[] }) {
  const [active, setActive] = useState(0)

  return (
    <div>
      <ul
        aria-label="Imagens do NFT"
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
        onScroll={(event) => {
          const target = event.currentTarget
          setActive(Math.round(target.scrollLeft / target.clientWidth))
        }}
      >
        {images.map((image, index) => (
          <li key={`${image.url}-${index}`} className="w-full shrink-0 snap-center" aria-label={`Imagem ${index + 1} de ${images.length}`}>
            <div className="aspect-square overflow-hidden rounded-3xl">
              <NftImage image={image} sizes="100vw" priority={index === 0} decorative={index > 0} />
            </div>
          </li>
        ))}
      </ul>
      {images.length > 1 ? (
        <div aria-hidden className="mt-2 flex justify-center gap-1.5">
          {images.map((image, index) => (
            <span
              key={`${image.url}-dot-${index}`}
              className={cn('size-1.5 rounded-full', index === active ? 'bg-primary' : 'bg-primary/30')}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
