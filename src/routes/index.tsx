import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { CatalogSection } from '@/features/catalog/catalog-section'
import { CATALOG_SEARCH_DEFAULTS, catalogSearchSchema, toCatalogParams } from '@/features/catalog/catalog-search'
import { MobileCatalogBar } from '@/features/catalog/mobile-catalog-bar'
import { HomeHero } from '@/features/home/home-hero'
import { JournalSection } from '@/features/home/journal-section'
import { PromoBanners } from '@/features/home/promo-banners'
import { journalQueryOptions } from '@/queries/journal-queries'
import { catalogQueryOptions, featuredQueryOptions } from '@/queries/nft-queries'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: {
    middlewares: [stripSearchParams(CATALOG_SEARCH_DEFAULTS)],
  },
  loaderDeps: ({ search }) => toCatalogParams(search),
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(catalogQueryOptions(deps))
    void context.queryClient.prefetchQuery(featuredQueryOptions())
    void context.queryClient.prefetchQuery(journalQueryOptions())
  },
  head: () => ({
    meta: [{ title: 'Kurio — Marketplace de NFTs' }],
  }),
  component: HomePage,
})

function HomePage() {
  const search = Route.useSearch()

  return (
    <>
      <MobileCatalogBar search={search} />
      <div className="pt-4 md:pt-0">
        <HomeHero />
      </div>
      <CatalogSection search={search} />
      <PromoBanners />
      <JournalSection />
    </>
  )
}
