import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { SearchIcon } from '@/components/icons/brand-icons'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { catalogQueryOptions } from '@/queries/nft-queries'
import { CatalogFilters, CatalogFiltersSkeleton } from './catalog-filters'
import { toCatalogParams, type CatalogSearch } from './catalog-search'
import { CatalogSortSelect } from './catalog-toolbar'
import { useCatalogNavigation } from './use-catalog-navigation'

function MobileSearchForm({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery)
  const { searchCatalog } = useCatalogNavigation()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void searchCatalog(query)
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative flex-1">
      <label htmlFor="mobile-search" className="sr-only">
        Explorar coleções
      </label>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        id="mobile-search"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Explorar coleções"
        maxLength={80}
        className="h-11 w-full rounded-lg bg-surface pr-3 pl-10 text-sm font-semibold tracking-wide placeholder:text-muted-foreground"
      />
    </form>
  )
}

export function MobileCatalogBar({ search }: { search: CatalogSearch }) {
  const { data } = useQuery(catalogQueryOptions(toCatalogParams(search)))
  const activeFilters =
    search.categories.length + search.networks.length + (search.minPrice || search.maxPrice ? 1 : 0)

  return (
    <div className="container-page flex items-center gap-3 pt-4 md:hidden">
      <MobileSearchForm key={search.q ?? ''} initialQuery={search.q ?? ''} />
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label={
              activeFilters ? `Filtros (${activeFilters} ${activeFilters === 1 ? 'filtro ativo' : 'filtros ativos'})` : 'Filtros'
            }
            className="relative flex size-11 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/70 text-primary-foreground"
          >
            <SlidersHorizontal className="size-5" aria-hidden />
            {activeFilters ? (
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[0.65rem] font-bold text-background">
                {activeFilters}
              </span>
            ) : null}
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto border-border bg-background">
          <SheetHeader>
            <SheetTitle>Filtrar catálogo</SheetTitle>
            <SheetDescription>Os resultados são atualizados a cada alteração.</SheetDescription>
          </SheetHeader>
          <div className="space-y-8 px-4 pb-8">
            <CatalogSortSelect value={search.sort} />
            {data ? <CatalogFilters search={search} facets={data.facets} /> : <CatalogFiltersSkeleton />}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
