import Decimal from 'decimal.js'

export type EthAmount = string

const EthDecimal = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

const ETH_PATTERN = /^\d+(\.\d+)?$/

export function isEthAmount(value: string): boolean {
  return ETH_PATTERN.test(value)
}

export function toEth(value: Decimal.Value): Decimal {
  return new EthDecimal(value)
}

export function addEth(...values: EthAmount[]): EthAmount {
  return values.reduce((total, value) => total.plus(value), toEth(0)).toFixed()
}

export function subtractEth(value: EthAmount, amount: EthAmount): EthAmount {
  return toEth(value).minus(amount).toFixed()
}

export function multiplyEth(value: EthAmount, quantity: number): EthAmount {
  if (!Number.isInteger(quantity)) {
    throw new RangeError('Quantity must be an integer')
  }
  return toEth(value).times(quantity).toFixed()
}

export function percentOfEth(value: EthAmount, percent: string): EthAmount {
  return toEth(value).times(percent).dividedBy(100).toDecimalPlaces(6, Decimal.ROUND_DOWN).toFixed()
}

export function compareEth(a: EthAmount, b: EthAmount): -1 | 0 | 1 {
  return toEth(a).comparedTo(b) as -1 | 0 | 1
}

export function isEthEqual(a: EthAmount, b: EthAmount): boolean {
  return compareEth(a, b) === 0
}

export function maxEth(a: EthAmount, b: EthAmount): EthAmount {
  return compareEth(a, b) >= 0 ? a : b
}

export function normalizeEth(value: EthAmount): EthAmount {
  return toEth(value).toFixed()
}

export function ethToCents(value: EthAmount, rounding: 'up' | 'down' = 'down'): number {
  const mode = rounding === 'up' ? Decimal.ROUND_UP : Decimal.ROUND_DOWN
  return toEth(value).times(100).toDecimalPlaces(0, mode).toNumber()
}

export function centsToEth(cents: number): EthAmount {
  if (!Number.isInteger(cents)) {
    throw new RangeError('Cents must be an integer')
  }
  return toEth(cents).dividedBy(100).toFixed(2)
}

export function formatEthLocale(value: EthAmount, fractionDigits = 2): string {
  return toEth(value).toFixed(fractionDigits).replace('.', ',')
}

export function formatEthValue(value: EthAmount, minimumFractionDigits = 2): string {
  const decimal = toEth(value)
  const places = Math.max(decimal.decimalPlaces(), minimumFractionDigits)
  return decimal.toFixed(places)
}

export function formatEth(value: EthAmount, minimumFractionDigits = 2): string {
  return `${formatEthValue(value, minimumFractionDigits)} ETH`
}
