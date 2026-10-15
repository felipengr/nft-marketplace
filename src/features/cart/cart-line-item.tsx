import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import type { CartLine, QuoteIssue } from '@/api/contracts/cart'
import { NftImage } from '@/components/nft/nft-image'
import { Skeleton } from '@/components/ui/skeleton'
import { QuantityStepper } from '@/features/nft-detail/quantity-stepper'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'

export const CART_GRID = 'md:grid md:grid-cols-[minmax(0,1fr)_7.5rem_8.5rem_7.5rem_3rem] md:items-center md:gap-4'

type CartLineItemProps = {
  line: CartLine
  issues: QuoteIssue[]
  pending: boolean
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function CartLineItem({ line, issues, pending, onQuantityChange, onRemove }: CartLineItemProps) {
  const maxQuantity = Math.max(line.maxQuantity, line.quantity)

  return (
    <li className={cn('relative overflow-hidden rounded-2xl bg-surface md:rounded-none', CART_GRID, pending && 'opacity-80')} aria-busy={pending}>
      <div className="flex min-w-0 gap-3 md:items-center md:gap-4">
        <div className="w-24 shrink-0 self-stretch overflow-hidden md:size-[4.375rem] md:w-auto md:self-auto">
          <NftImage image={line.image} sizes="100px" decorative className="h-full" />
        </div>
        <div className="min-w-0 py-3 md:py-0">
          <h3 className="truncate pr-10 font-bold tracking-wide md:pr-0">
            <Link to="/nfts/$nftId" params={{ nftId: line.nftId }} search={{ edition: line.editionId }} className="hover:text-primary">
              {line.name}
            </Link>
          </h3>
          <p className="text-sm text-subtle">
            <span className="hidden md:block">ID do token: {line.tokenId}</span>
            <span className="block">Edição: {line.editionLabel}</span>
          </p>
          <p className="mt-2 text-lg font-bold text-primary md:hidden">
            <span className="sr-only">Total do item: </span>
            {formatEth(line.lineTotal)}
          </p>
        </div>
      </div>

      <p className="hidden font-bold text-subtle md:block">
        <span className="sr-only">Preço unitário: </span>
        {formatEth(line.unitPrice)}
      </p>

      <div className="absolute top-1/2 right-3 -translate-y-1/2 md:static md:translate-y-0">
        <QuantityStepper value={line.quantity} max={maxQuantity} onChange={onQuantityChange} size="sm" label={`Quantidade de ${line.name}`} />
      </div>

      <p className="hidden font-bold text-primary md:block">
        <span className="sr-only">Total do item: </span>
        {formatEth(line.lineTotal)}
      </p>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover ${line.name} do carrinho`}
        className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-sm text-subtle transition-colors hover:text-destructive md:static"
      >
        <Trash2 className="size-5" aria-hidden />
      </button>

      {issues.length ? (
        <ul className="col-span-full px-3 pb-3 text-xs text-primary md:px-0">
          {issues.map((issue) => (
            <li key={`${issue.kind}-${issue.lineId}`}>⚠ {issue.message}</li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function CartLineSkeleton() {
  return (
    <li className={cn('flex gap-3 overflow-hidden rounded-2xl bg-surface md:rounded-none', CART_GRID)} aria-hidden>
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-none bg-secondary md:size-[4.375rem]" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="hidden h-4 w-16 md:block" />
      <Skeleton className="hidden h-7 w-20 md:block" />
      <Skeleton className="hidden h-4 w-16 md:block" />
      <span />
    </li>
  )
}
