import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { EmptyState, ErrorState, InlineError } from '@/components/feedback/query-states'
import { NftCard, NftCardSkeleton } from '@/components/nft/nft-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { catalogQueryOptions } from '@/queries/nft-queries'
import { CatalogFilters, CatalogFiltersSkeleton } from './catalog-filters'
import { CatalogPagination } from './catalog-pagination'
import { CATALOG_SECTION_ID, catalogSummary, toCatalogParams, type CatalogSearch } from './catalog-search'
import { CatalogSortSelect, CatalogTabs } from './catalog-toolbar'
import { SpotlightCard } from './spotlight-card'
import { useCatalogNavigation } from './use-catalog-navigation'

const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-8 pb-8 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:pb-0'

const STAGGER_CLASS = '[&>*:nth-child(even)]:translate-y-8 lg:[&>*:nth-child(even)]:translate-y-0'

function CatalogGridSkeleton() {
  return (
    <div className={cn(GRID_CLASS, STAGGER_CLASS)} aria-hidden>
      {Array.from({ length: 9 }, (_, index) => (
        <NftCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function CatalogSection({ search }: { search: CatalogSearch }) {
  const { data, error, isPending, isError, isFetching, isPlaceholderData, refetch } = useQuery(
    catalogQueryOptions(toCatalogParams(search)),
  )
  const { clearFilters } = useCatalogNavigation()
  const updating = isFetching && !isPending
  const outOfRange = data && data.items.length === 0 && data.pagination.totalItems > 0

  return (
    <section id={CATALOG_SECTION_ID} aria-labelledby="catalog-title" className="container-page scroll-mt-6 pt-10 md:pt-24">
      <h2 id="catalog-title" className="sr-only">
        Catálogo de NFTs
      </h2>
      <div className="grid gap-8 md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[19.375rem_minmax(0,1fr)] lg:gap-12">
        <aside aria-label="Filtros do catálogo" className="hidden space-y-6 md:block">
          <div className="rounded-sm bg-surface px-3 py-6 lg:px-5">
            {data ? <CatalogFilters search={search} facets={data.facets} /> : <CatalogFiltersSkeleton />}
          </div>
          <SpotlightCard />
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <CatalogTabs active={search.tab} />
            <div className="hidden md:block">
              <CatalogSortSelect value={search.sort} />
            </div>
          </div>

          <div className="mb-4 flex min-h-6 items-center justify-between gap-3 text-sm text-subtle">
            <p aria-live="polite" aria-atomic="true">
              {data && !updating ? catalogSummary(search, data.pagination.totalItems) : null}
            </p>
            {updating ? (
              <p className="flex items-center gap-2" role="status">
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Atualizando…
              </p>
            ) : null}
          </div>

          {isError && data ? (
            <div className="mb-6">
              <InlineError error={error} onRetry={() => void refetch()} retrying={isFetching} />
            </div>
          ) : null}

          <div aria-busy={isFetching} className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
            {isPending ? (
              <CatalogGridSkeleton />
            ) : isError && !data ? (
              <ErrorState title="Não foi possível carregar o catálogo" error={error} onRetry={() => void refetch()} retrying={isFetching} />
            ) : outOfRange ? (
              <EmptyState
                title="Página inexistente"
                description={`Esta busca tem ${data.pagination.totalPages} página(s).`}
                action={
                  <Button asChild>
                    <Link to="/" search={(previous) => ({ ...previous, page: undefined })} hash={CATALOG_SECTION_ID}>
                      Ir para a primeira página
                    </Link>
                  </Button>
                }
              />
            ) : data.items.length === 0 ? (
              <EmptyState
                title="Nenhum NFT encontrado"
                description="Ajuste a busca ou os filtros para ver mais resultados."
                action={<Button onClick={() => void clearFilters()}>Limpar filtros</Button>}
              />
            ) : (
              <ul className={cn(GRID_CLASS, STAGGER_CLASS)}>
                {data.items.map((nft, index) => (
                  <li key={nft.id}>
                    <NftCard nft={nft} priority={index < 3} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {data && !outOfRange ? (
            <div className="mt-10">
              <CatalogPagination page={data.pagination.page} totalPages={data.pagination.totalPages} />
            </div>
          ) : null}
        </div>
      </div>
      <SpotlightCard className="mx-auto mt-12 max-w-sm md:hidden" />
    </section>
  )
}
