import { Link } from '@tanstack/react-router'
import type { CatalogSort, CatalogTab } from '@/api/contracts/nft'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useCatalogNavigation } from './use-catalog-navigation'

const TABS: Array<{ value: CatalogTab; label: string }> = [
  { value: 'all', label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lançamentos' },
  { value: 'trending', label: 'Em alta' },
]

const SORT_OPTIONS: Array<{ value: CatalogSort; label: string }> = [
  { value: 'recent', label: 'Listados recentemente' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'rating', label: 'Mais bem avaliados' },
]

export function CatalogTabs({ active }: { active: CatalogTab }) {
  return (
    <nav aria-label="Listas do catálogo" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max items-center gap-3 sm:gap-5">
        {TABS.map((tab) => {
          const selected = tab.value === active
          return (
            <li key={tab.value}>
              <Link
                to="/"
                search={(previous) => ({ ...previous, tab: tab.value === 'all' ? undefined : tab.value, page: undefined })}
                resetScroll={false}
                aria-current={selected ? 'true' : undefined}
                className={cn(
                  'inline-block border-b-2 pb-1 text-sm transition-colors hover:text-primary sm:text-[0.95rem] sm:font-semibold sm:tracking-wide',
                  selected ? 'border-primary text-primary' : 'border-transparent text-foreground',
                )}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function CatalogSortSelect({ value }: { value: CatalogSort }) {
  const { updateFilters } = useCatalogNavigation()
  return (
    <div className="flex items-center gap-1">
      <label id="catalog-sort-label" htmlFor="catalog-sort" className="text-[0.95rem] tracking-wide whitespace-nowrap">
        Ordenar por:
      </label>
      <Select value={value} onValueChange={(next) => updateFilters({ sort: next as CatalogSort })}>
        <SelectTrigger
          id="catalog-sort"
          aria-labelledby="catalog-sort-label catalog-sort"
          className="h-9 border-none bg-transparent px-1 text-[0.95rem] tracking-wide shadow-none focus-visible:ring-0"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="border border-border bg-surface">
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
