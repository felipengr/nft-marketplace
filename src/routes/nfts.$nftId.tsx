import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, notFound, useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { z } from 'zod'
import { isApiError } from '@/api/api-error'
import { ErrorState } from '@/components/feedback/query-states'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { NftDetailSkeleton } from '@/features/nft-detail/nft-detail-skeleton'
import { NftDetailView } from '@/features/nft-detail/nft-detail-view'
import { nftQueryOptions } from '@/queries/nft-queries'

const detailSearchSchema = z.object({
  edition: z.string().max(40).optional().catch(undefined),
})

export const Route = createFileRoute('/nfts/$nftId')({
  validateSearch: detailSearchSchema,
  staticData: { mobileNav: false },
  loader: async ({ context, params }) => {
    try {
      const nft = await context.queryClient.ensureQueryData(nftQueryOptions(params.nftId))
      return { name: nft.name }
    } catch (error) {
      if (isApiError(error) && error.code === 'NOT_FOUND') throw notFound()
      throw error
    }
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.name} — Kurio` : 'NFT — Kurio' }],
  }),
  pendingMs: 150,
  pendingMinMs: 300,
  pendingComponent: NftDetailSkeleton,
  notFoundComponent: () => (
    <NotFoundPage title="NFT não encontrado" description="Este NFT não existe ou foi removido do catálogo." />
  ),
  errorComponent: NftDetailError,
  component: NftDetailPage,
})

function NftDetailError({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <div className="container-page py-16">
      <ErrorState
        title="Não foi possível carregar o NFT"
        error={error}
        onRetry={() => {
          reset()
          void router.invalidate()
        }}
      />
    </div>
  )
}

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data } = useSuspenseQuery(nftQueryOptions(nftId))
  const requested = data.editions.find((edition) => edition.id === search.edition && edition.available > 0)
  const editionId = requested?.id ?? data.defaultEditionId

  return (
    <NftDetailView
      key={data.id}
      nft={data}
      editionId={editionId}
      onEditionChange={(edition) =>
        void navigate({
          search: { edition: edition === data.defaultEditionId ? undefined : edition },
          replace: true,
          resetScroll: false,
        })
      }
    />
  )
}
