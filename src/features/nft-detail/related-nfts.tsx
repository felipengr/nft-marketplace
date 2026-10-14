import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { NftCard, NftCardSkeleton } from '@/components/nft/nft-card'
import { cn } from '@/lib/utils'
import { relatedNftsQueryOptions } from '@/queries/nft-queries'

const ITEM_CLASS = 'w-[calc((100%-1rem)/2)] shrink-0 snap-start sm:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-6.25rem)/5)]'

function useCarouselPages(trackRef: React.RefObject<HTMLUListElement | null>, itemCount: number) {
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(0)

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const total = Math.max(1, Math.ceil(track.scrollWidth / track.clientWidth - 0.05))
    setPages(total)
    setPage(Math.min(total - 1, Math.round(track.scrollLeft / track.clientWidth)))
  }, [trackRef])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    return () => observer.disconnect()
  }, [trackRef, measure, itemCount])

  const goTo = (target: number) => {
    const track = trackRef.current
    if (!track) return
    track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' })
  }

  return { pages, page, measure, goTo }
}

export function RelatedNfts({ nftId }: { nftId: string }) {
  const { data, isPending, isError } = useQuery(relatedNftsQueryOptions(nftId))
  const trackRef = useRef<HTMLUListElement>(null)
  const { pages, page, measure, goTo } = useCarouselPages(trackRef, data?.items.length ?? 0)

  if (isError || (data && data.items.length === 0)) return null

  return (
    <section aria-labelledby="related-title" className="container-page pt-16 md:pt-24">
      <h2 id="related-title" className="mb-8 border-b border-secondary pb-2 text-lg font-bold text-primary">
        Mais desta coleção
      </h2>
      {isPending ? (
        <div className="flex gap-4 overflow-hidden sm:gap-6" aria-hidden>
          {Array.from({ length: 5 }, (_, index) => (
            <NftCardSkeleton key={index} className={ITEM_CLASS} />
          ))}
        </div>
      ) : (
        <>
          <ul
            ref={trackRef}
            onScroll={measure}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] sm:gap-6"
          >
            {data.items.map((nft) => (
              <li key={nft.id} className={ITEM_CLASS}>
                <NftCard nft={nft} sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw" />
              </li>
            ))}
          </ul>
          {pages > 1 ? (
            <div role="group" aria-label="Páginas do carrossel" className="mt-6 flex justify-center gap-1">
              {Array.from({ length: pages }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Ir para a página ${index + 1} de ${pages}`}
                  aria-pressed={index === page}
                  onClick={() => goTo(index)}
                  className="flex size-6 items-center justify-center"
                >
                  <span className={cn('size-3 rounded-full border border-primary', index === page && 'bg-primary')} />
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
