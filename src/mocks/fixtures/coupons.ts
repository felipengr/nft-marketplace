export type CouponRecord = {
  code: string
  description: string
  kind: 'percent' | 'fixed'
  value: string
  minSubtotal: string | null
  expiresAt: string
}

export const COUPONS: CouponRecord[] = [
  {
    code: 'KURIO10',
    description: '10% de desconto no lançamento',
    kind: 'percent',
    value: '10',
    minSubtotal: null,
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
  {
    code: 'GENESIS',
    description: '0.05 ETH de desconto em pedidos acima de 0.5 ETH',
    kind: 'fixed',
    value: '0.05',
    minSubtotal: '0.5',
    expiresAt: '2027-12-31T23:59:59.000Z',
  },
  {
    code: 'BEMVINDO',
    description: '15% de desconto de boas-vindas',
    kind: 'percent',
    value: '15',
    minSubtotal: null,
    expiresAt: '2026-01-31T23:59:59.000Z',
  },
]

export const NETWORK_FEE = '0.016'
