import { Link, createFileRoute } from '@tanstack/react-router'
import { EmptyState, ErrorState } from '@/components/feedback/query-states'
import { NftCard, NftCardSkeleton } from '@/components/nft/nft-card'
import { Button } from '@/components/ui/button'
import { CATALOG_SECTION_ID } from '@/features/catalog/catalog-search'
import { useFavorites } from '@/features/favorites/use-favorites'

export const Route = createFileRoute('/_authenticated/favorites')({
  head: () => ({ meta: [{ title: 'Favoritos — Kurio' }] }),
  component: FavoritesPage,
})

const GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8'

function FavoritesPage() {
  const { data, error, isPending, isError, isFetching, refetch } = useFavorites()

  return (
    <section aria-labelledby="favorites-title" className="container-page py-8 md:py-12">
      <h1 id="favorites-title" className="mb-2 text-2xl font-bold">
        Favoritos
      </h1>
      <p className="mb-8 text-sm text-subtle" aria-live="polite">
        {data ? `${data.items.length} ${data.items.length === 1 ? 'NFT salvo' : 'NFTs salvos'}` : ' '}
      </p>
      {isPending ? (
        <div className={GRID_CLASS} aria-hidden>
          {Array.from({ length: 4 }, (_, index) => (
            <NftCardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Não foi possível carregar seus favoritos" error={error} onRetry={() => void refetch()} retrying={isFetching} />
      ) : data.items.length === 0 ? (
        <EmptyState
          title="Você ainda não tem favoritos"
          description="Toque no coração de um NFT para salvá-lo aqui."
          action={
            <Button asChild>
              <Link to="/" hash={CATALOG_SECTION_ID}>
                Explorar NFTs
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className={GRID_CLASS}>
          {data.items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
