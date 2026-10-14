import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ErrorState } from '@/components/feedback/query-states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { nftReviewsQueryOptions } from '@/queries/nft-queries'
import { formatRating } from './rating'
import { RatingStars } from './rating-stars'

const PAGE_SIZE = 5

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

export function NftReviews({ nftId }: { nftId: string }) {
  const { data, error, isPending, isError, isFetching, refetch } = useQuery(nftReviewsQueryOptions(nftId))
  const [visible, setVisible] = useState(PAGE_SIZE)

  if (isPending) {
    return (
      <div className="space-y-4" aria-hidden>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="space-y-2 rounded-sm bg-surface p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return <ErrorState title="Não foi possível carregar as avaliações" error={error} onRetry={() => void refetch()} retrying={isFetching} />
  }

  if (data.count === 0) {
    return <p className="text-sm text-subtle">Este NFT ainda não recebeu avaliações.</p>
  }

  return (
    <div className="space-y-4">
      <p className="flex flex-wrap items-center gap-3 text-sm">
        <RatingStars average={data.average} />
        <span>
          Média {formatRating(data.average)} de 5 em {data.count} {data.count === 1 ? 'avaliação' : 'avaliações'}
        </span>
      </p>
      <ul className="space-y-3">
        {data.items.slice(0, visible).map((review) => (
          <li key={review.id} className="rounded-sm bg-surface p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold">@{review.author}</p>
              <p className="flex items-center gap-3 text-xs text-subtle">
                <RatingStars average={String(review.rating)} className="[&_svg]:size-3.5" />
                <time dateTime={review.createdAt}>{dateFormatter.format(new Date(review.createdAt))}</time>
              </p>
            </div>
            <p className="text-sm leading-6 text-subtle">{review.comment}</p>
          </li>
        ))}
      </ul>
      {visible < data.items.length ? (
        <Button variant="outline" onClick={() => setVisible((current) => current + PAGE_SIZE)}>
          Mostrar mais avaliações
        </Button>
      ) : null}
    </div>
  )
}
