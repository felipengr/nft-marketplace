import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { Category, CatalogTab } from '@/api/contracts/nft'
import { Button } from '@/components/ui/button'
import { CATALOG_SECTION_ID } from '@/features/catalog/catalog-search'

type Banner = {
  title: [string, string]
  description: string
  image: string
  search: { tab?: CatalogTab; categories?: Category[] }
}

const BANNERS: Banner[] = [
  {
    title: ['Lançamentos gênesis', 'de edição limitada'],
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: 'glasses-ape',
    search: { tab: 'new' },
  },
  {
    title: ['Arte digital selecionada', 'e muito mais'],
    description: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: 'blazer-ape',
    search: { categories: ['digital-art'] },
  },
]

export function PromoBanners() {
  return (
    <section aria-label="Coleções em destaque" className="container-page pt-20 md:pt-28">
      <ul className="grid gap-6 lg:grid-cols-2 lg:gap-7">
        {BANNERS.map((banner) => (
          <li key={banner.image} className="grid grid-cols-[minmax(0,0.49fr)_minmax(0,0.51fr)] overflow-hidden rounded-sm bg-surface">
            <img
              src={`/images/nfts/${banner.image}-400.webp`}
              srcSet={`/images/nfts/${banner.image}-400.webp 400w, /images/nfts/${banner.image}-800.webp 800w`}
              sizes="(min-width: 1024px) 290px, 50vw"
              alt=""
              width={400}
              height={400}
              loading="lazy"
              decoding="async"
              className="aspect-[287/250] size-full rounded-2xl object-cover"
            />
            <div className="flex flex-col items-end justify-center gap-3 p-4 text-right sm:p-6">
              <h2 className="text-sm leading-6 font-bold sm:text-lg sm:tracking-wide">
                {banner.title[0]}
                <br className="hidden sm:inline" /> {banner.title[1]}
              </h2>
              <p className="hidden text-sm leading-6 text-subtle sm:block">{banner.description}</p>
              <Button asChild size="lg" className="font-semibold">
                <Link to="/" search={banner.search} hash={CATALOG_SECTION_ID} aria-label={`Explorar: ${banner.title.join(' ')}`}>
                  Explorar
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
