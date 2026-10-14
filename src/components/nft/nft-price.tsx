import { formatEth, type EthAmount } from '@/lib/money'
import { cn } from '@/lib/utils'

type NftPriceProps = {
  price: EthAmount
  previousPrice?: EthAmount | null
  className?: string
}

export function NftPrice({ price, previousPrice, className }: NftPriceProps) {
  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2 text-lg tracking-wide', className)}>
      <span className="font-bold text-primary">
        <span className="sr-only">Preço: </span>
        {formatEth(price)}
      </span>
      {previousPrice ? (
        <span className="text-muted-foreground line-through">
          <span className="sr-only">Preço anterior: </span>
          {formatEth(previousPrice)}
        </span>
      ) : null}
    </p>
  )
}
