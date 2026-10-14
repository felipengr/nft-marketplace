import type { Image } from '@/api/contracts/common'
import { cn } from '@/lib/utils'

type NftImageProps = {
  image: Image
  sizes: string
  className?: string
  priority?: boolean
  decorative?: boolean
}

export function NftImage({ image, sizes, className, priority = false, decorative = false }: NftImageProps) {
  return (
    <img
      src={image.url}
      srcSet={image.sources.map((source) => `${source.url} ${source.width}w`).join(', ')}
      sizes={sizes}
      alt={decorative ? '' : image.alt}
      width={800}
      height={800}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      className={cn('size-full object-cover', className)}
    />
  )
}
