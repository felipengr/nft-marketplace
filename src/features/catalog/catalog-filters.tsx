import type { CatalogFacets } from '@/api/contracts/nft'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { CatalogSearch } from './catalog-search'
import { PriceRangeFilter } from './price-range-filter'
import { useCatalogNavigation } from './use-catalog-navigation'

type FacetOption<T extends string> = { value: T; label: string; count: number }

type FacetListProps<T extends string> = {
  title: string
  options: FacetOption<T>[]
  selected: T[]
  onToggle: (value: T) => void
}

function FacetList<T extends string>({ title, options, selected, onToggle }: FacetListProps<T>) {
  const headingId = `facet-${title.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-lg font-bold">
        {title}
      </h2>
      <ul className="space-y-1">
        {options.map((option) => {
          const active = selected.includes(option.value)
          return (
            <li key={option.value}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(option.value)}
                className={cn(
                  'relative flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm tracking-wide transition-colors hover:bg-secondary',
                  active ? 'font-semibold text-primary' : 'text-subtle',
                )}
              >
                <span>
                  <span
                    aria-hidden
                    className={cn('absolute top-1/2 left-0.5 size-1.5 -translate-y-1/2 rounded-full', active ? 'bg-primary' : 'hidden')}
                  />
                  {option.label}
                </span>
                <span className="tabular-nums">({option.count})</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

type CatalogFiltersProps = {
  search: CatalogSearch
  facets: CatalogFacets
  className?: string
}

export function CatalogFilters({ search, facets, className }: CatalogFiltersProps) {
  const { updateFilters, clearFilters } = useCatalogNavigation()
  const hasFilters = search.categories.length > 0 || search.networks.length > 0 || search.minPrice || search.maxPrice || search.q

  return (
    <div className={cn('space-y-8', className)}>
      <FacetList
        title="Coleções"
        options={facets.categories}
        selected={search.categories}
        onToggle={(value) => updateFilters({ categories: toggle(search.categories, value) })}
      />
      <section aria-labelledby="facet-price">
        <h2 id="facet-price" className="mb-3 text-lg font-bold">
          Faixa de preço
        </h2>
        <PriceRangeFilter
          key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}-${facets.priceRange.min}-${facets.priceRange.max}`}
          range={facets.priceRange}
          minPrice={search.minPrice}
          maxPrice={search.maxPrice}
          onApply={(value) => updateFilters(value)}
        />
      </section>
      <FacetList
        title="Rede"
        options={facets.networks}
        selected={search.networks}
        onToggle={(value) => updateFilters({ networks: toggle(search.networks, value) })}
      />
      {hasFilters ? (
        <button
          type="button"
          onClick={() => clearFilters()}
          className="px-3 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          Limpar filtros
        </button>
      ) : null}
    </div>
  )
}

export function CatalogFiltersSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      {[9, 0, 3].map((rows, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="h-6 w-32" />
          {rows === 0 ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            Array.from({ length: rows }, (_, row) => <Skeleton key={row} className="h-7 w-full" />)
          )}
        </div>
      ))}
    </div>
  )
}
