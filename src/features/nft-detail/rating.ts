import { toEth } from '@/lib/money'

export function formatRating(average: string): string {
  return toEth(average).toFixed(1).replace('.', ',')
}

export function roundedStars(average: string): number {
  return toEth(average).toDecimalPlaces(0).toNumber()
}
