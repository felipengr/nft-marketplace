import type { Wallet } from '@/api/contracts/wallet'

export type WalletRecord = Wallet & { userId: string }

export function createWalletFixtures(): WalletRecord[] {
  return [
    {
      id: 'wal_ana_primary',
      userId: 'usr_ana',
      kind: 'primary',
      label: 'Principal',
      address: '0xA91F3c6B2d8E4f71a0B5C9d2E3F4a5B6c7D8E82C',
      ensName: 'analima.eth',
      network: 'ethereum',
      provider: 'metamask',
    },
    {
      id: 'wal_ana_secondary',
      userId: 'usr_ana',
      kind: 'secondary',
      label: 'Reserva',
      address: '0x5C2e9A7b1D3f4E6a8B0c2D4e6F8a0B2c4D6e7F91',
      ensName: 'nova.kurio.eth',
      network: 'polygon',
      provider: 'coinbase',
    },
    {
      id: 'wal_felipe_primary',
      userId: 'usr_felipe',
      kind: 'primary',
      label: 'Principal',
      address: '0x7F4d2C9a1B3e5D7f9A0b2C4d6E8f0A1b3C5d7E9F',
      ensName: 'felipenogueira.eth',
      network: 'ethereum',
      provider: 'metamask',
    },
    {
      id: 'wal_alison_primary',
      userId: 'usr_alison',
      kind: 'primary',
      label: 'Principal',
      address: '0x3B8e1A5c7D9f2B4d6E8a0C2e4F6b8D0f2A4c6E81',
      ensName: null,
      network: 'polygon',
      provider: 'walletconnect',
    },
  ]
}
