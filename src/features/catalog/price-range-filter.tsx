import { useState } from 'react'
import type { CatalogFacets } from '@/api/contracts/nft'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { centsToEth, compareEth, ethToCents, formatEthLocale, type EthAmount } from '@/lib/money'

type PriceRangeFilterProps = {
  range: CatalogFacets['priceRange']
  minPrice?: EthAmount
  maxPrice?: EthAmount
  onApply: (value: { minPrice?: EthAmount; maxPrice?: EthAmount }) => void
}

export function PriceRangeFilter({ range, minPrice, maxPrice, onApply }: PriceRangeFilterProps) {
  const bounds: [number, number] = [ethToCents(range.min, 'down'), ethToCents(range.max, 'up')]
  const [value, setValue] = useState<[number, number]>([
    minPrice ? ethToCents(minPrice) : bounds[0],
    maxPrice ? ethToCents(maxPrice, 'up') : bounds[1],
  ])
  const disabled = bounds[0] >= bounds[1]
  const selectedMin = centsToEth(value[0])
  const selectedMax = centsToEth(value[1])

  function handleApply() {
    onApply({
      minPrice: compareEth(selectedMin, range.min) <= 0 ? undefined : selectedMin,
      maxPrice: compareEth(selectedMax, range.max) >= 0 ? undefined : selectedMax,
    })
  }

  return (
    <div className="space-y-3">
      <Slider
        min={bounds[0]}
        max={Math.max(bounds[1], bounds[0] + 1)}
        step={1}
        minStepsBetweenThumbs={1}
        value={value}
        disabled={disabled}
        onValueChange={(next) => setValue([next[0], next[1]])}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        className="px-1 py-2"
      />
      <p className="px-3 text-sm tracking-wide" aria-live="polite">
        Preço: {formatEthLocale(selectedMin)} - {formatEthLocale(selectedMax)} ETH
      </p>
      <Button size="default" className="ml-3" onClick={handleApply} disabled={disabled}>
        Aplicar
      </Button>
    </div>
  )
}
