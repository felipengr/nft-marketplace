import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATALOG_SECTION_ID } from './catalog-search'

type CatalogPaginationProps = {
  page: number
  totalPages: number
}

type PageItem = number | 'gap-start' | 'gap-end'

function pageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const items: PageItem[] = [1]
  const start = page <= 4 ? 2 : Math.min(page - 1, totalPages - 4)
  const end = Math.min(totalPages - 1, start + 3)
  if (start > 2) items.push('gap-start')
  for (let current = start; current <= end; current += 1) items.push(current)
  if (end < totalPages - 1) items.push('gap-end')
  items.push(totalPages)
  return items
}

const ITEM_CLASS =
  'flex size-9 items-center justify-center rounded-sm border border-border text-sm tabular-nums transition-colors hover:border-primary hover:text-primary'

export function CatalogPagination({ page, totalPages }: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-end">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 ? (
          <li>
            <Link
              to="/"
              search={(previous) => ({ ...previous, page: page - 1 === 1 ? undefined : page - 1 })}
              hash={CATALOG_SECTION_ID}
              aria-label="Página anterior"
              className={ITEM_CLASS}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
          </li>
        ) : null}
        {pageItems(page, totalPages).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <Link
                to="/"
                search={(previous) => ({ ...previous, page: item === 1 ? undefined : item })}
                hash={CATALOG_SECTION_ID}
                aria-label={`Página ${item}`}
                aria-current={item === page ? 'page' : undefined}
                className={cn(ITEM_CLASS, item === page && 'border-primary bg-primary font-bold text-primary-foreground hover:text-primary-foreground')}
              >
                {item}
              </Link>
            </li>
          ) : (
            <li key={item} aria-hidden className="px-1 text-muted-foreground">
              …
            </li>
          ),
        )}
        {page < totalPages ? (
          <li>
            <Link
              to="/"
              search={(previous) => ({ ...previous, page: page + 1 })}
              hash={CATALOG_SECTION_ID}
              aria-label="Próxima página"
              className={ITEM_CLASS}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
