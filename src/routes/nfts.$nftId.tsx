import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { isApiError } from '@/api/api-error'
import { ErrorState } from '@/components/feedback/query-states'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { NftImage } from '@/components/nft/nft-image'
import { NftPrice } from '@/components/nft/nft-price'
import { Skeleton } from '@/components/ui/skeleton'
import { nftQueryOptions } from '@/queries/nft-queries'

export const Route = createFileRoute('/nfts/$nftId')({
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftQueryOptions(params.nftId))
  },
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const { data, error, isPending, isError, isFetching, refetch } = useQuery(nftQueryOptions(nftId))

  if (isError && isApiError(error) && error.code === 'NOT_FOUND') {
    return <NotFoundPage title="NFT não encontrado" description="Este NFT não existe ou foi removido do catálogo." />
  }

  return (
    <section className="container-page grid gap-8 py-10 md:grid-cols-2">
      {isPending ? (
        <>
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-7 w-1/4" />
          </div>
        </>
      ) : isError ? (
        <ErrorState title="Não foi possível carregar o NFT" error={error} onRetry={() => void refetch()} retrying={isFetching} className="md:col-span-2" />
      ) : (
        <>
          <div className="aspect-square overflow-hidden rounded-2xl">
            <NftImage image={data.image} sizes="(min-width: 768px) 50vw, 100vw" priority />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">{data.name}</h1>
            <NftPrice price={data.price} previousPrice={data.previousPrice} className="text-2xl" />
            <p className="text-subtle">{data.summary}</p>
          </div>
        </>
      )}
    </section>
  )
}
