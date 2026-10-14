import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRating, roundedStars } from './rating'

type RatingStarsProps = {
  average: string
  className?: string
}

export function RatingStars({ average, className }: RatingStarsProps) {
  const filled = roundedStars(average)
  return (
    <span role="img" aria-label={`Avaliação ${formatRating(average)} de 5`} className={cn('inline-flex gap-1', className)}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden
          className={cn('size-4', index < filled ? 'fill-primary text-primary' : 'fill-transparent text-primary/60')}
        />
      ))}
    </span>
  )
}
