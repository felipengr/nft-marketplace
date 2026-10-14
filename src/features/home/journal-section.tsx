import { useQuery } from '@tanstack/react-query'
import { NftImage } from '@/components/nft/nft-image'
import { ErrorState } from '@/components/feedback/query-states'
import { Skeleton } from '@/components/ui/skeleton'
import { notifyComingSoon } from '@/lib/coming-soon'
import { journalQueryOptions } from '@/queries/journal-queries'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' })

const GRID_CLASS =
  '-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&>*]:w-[78%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto'

function JournalSkeleton() {
  return (
    <div className={GRID_CLASS} aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-sm bg-surface">
          <Skeleton className="aspect-[268/195] rounded-none bg-secondary" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function JournalSection() {
  const { data, error, isPending, isError, isFetching, refetch } = useQuery(journalQueryOptions())

  return (
    <section aria-labelledby="journal-title" className="container-page pt-20 md:pt-28">
      <header className="mb-10 text-center">
        <h2 id="journal-title" className="mb-3 text-2xl font-bold tracking-wide md:text-[1.75rem]">
          {data?.title ?? 'Diário da Cunhagem'}
        </h2>
        {data ? <p className="text-sm tracking-wide text-subtle">{data.subtitle}</p> : <Skeleton className="mx-auto h-4 w-72" />}
      </header>
      {isPending ? (
        <JournalSkeleton />
      ) : isError ? (
        <ErrorState title="Não foi possível carregar o diário" error={error} onRetry={() => void refetch()} retrying={isFetching} />
      ) : (
        <ul className={GRID_CLASS}>
          {data.items.map((post) => (
            <li key={post.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-sm bg-surface">
                <div className="aspect-[268/195] overflow-hidden">
                  <NftImage image={post.image} sizes="(min-width: 1024px) 268px, (min-width: 640px) 45vw, 90vw" decorative />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="mb-3 text-xs tracking-wide text-subtle">
                    <time dateTime={post.publishedAt}>{dateFormatter.format(new Date(post.publishedAt))}</time>
                    <span aria-hidden className="px-2">
                      |
                    </span>
                    Leitura de {post.readingMinutes} min
                  </p>
                  <h3 className="mb-2 text-base leading-snug font-bold">{post.title}</h3>
                  <p className="mb-3 flex-1 text-xs leading-5 text-subtle">{post.excerpt}</p>
                  <button
                    type="button"
                    onClick={() => notifyComingSoon('O Diário da Cunhagem')}
                    className="w-fit text-xs font-bold text-primary underline-offset-4 hover:underline"
                    aria-label={`Ler mais: ${post.title}`}
                  >
                    Ler mais →
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
