import { Skeleton } from '@/components/ui/skeleton'

export function NftDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT">
      <div className="md:hidden">
        <Skeleton className="aspect-square rounded-none" />
        <div className="-mt-8 space-y-4 rounded-t-3xl bg-surface px-4 py-6">
          <Skeleton className="h-7 w-2/3 bg-secondary" />
          <Skeleton className="h-16 w-full bg-secondary" />
          <Skeleton className="h-7 w-3/4 bg-secondary" />
        </div>
      </div>
      <div className="container-page hidden pt-8 md:block">
        <Skeleton className="mb-5 h-5 w-40" />
        <div className="grid grid-cols-[minmax(0,35.75rem)_minmax(0,1fr)] gap-8">
          <div className="grid grid-cols-[6.25rem_minmax(0,1fr)] gap-7">
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="aspect-square" />
              ))}
            </div>
            <Skeleton className="aspect-square rounded-2xl" />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}
