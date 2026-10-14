import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { CATALOG_SECTION_ID, type CatalogSearch } from './catalog-search'

type CatalogPatch = Partial<Omit<CatalogSearch, 'page'>>

export function useCatalogNavigation() {
  const navigate = useNavigate()

  const updateFilters = useCallback(
    (patch: CatalogPatch) =>
      navigate({
        to: '/',
        search: (previous) => ({ ...previous, ...patch, page: undefined }),
        resetScroll: false,
      }),
    [navigate],
  )

  const searchCatalog = useCallback(
    (query: string) =>
      navigate({
        to: '/',
        search: (previous) => ({ ...previous, q: query.trim() || undefined, page: undefined }),
        hash: CATALOG_SECTION_ID,
      }),
    [navigate],
  )

  const clearFilters = useCallback(
    () =>
      navigate({
        to: '/',
        search: (previous) => ({ tab: previous.tab, sort: previous.sort }),
        resetScroll: false,
      }),
    [navigate],
  )

  return { updateFilters, searchCatalog, clearFilters }
}
