import { z } from 'zod'

export const walletNetworkSchema = z.enum(['ethereum', 'polygon'])

export type WalletNetwork = z.infer<typeof walletNetworkSchema>

export const walletProviderSchema = z.enum(['metamask', 'walletconnect', 'coinbase'])

export type WalletProvider = z.infer<typeof walletProviderSchema>

export const WALLET_NETWORK_LABELS: Record<WalletNetwork, string> = {
  ethereum: 'Rede principal Ethereum',
  polygon: 'Rede Polygon',
}

export const WALLET_PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

export const evmAddressSchema = z.string().trim().regex(/^0x[a-fA-F0-9]{40}$/, { error: 'Informe um endereço 0x válido com 40 caracteres hexadecimais.' })

export const walletSchema = z.object({
  id: z.string(),
  kind: z.enum(['primary', 'secondary']),
  label: z.string(),
  address: z.string(),
  ensName: z.string().nullable(),
  network: walletNetworkSchema,
  provider: walletProviderSchema,
})

export type Wallet = z.infer<typeof walletSchema>

export const walletsResponseSchema = z.object({
  items: z.array(walletSchema),
})

export const connectWalletInputSchema = z.object({
  provider: walletProviderSchema,
  network: walletNetworkSchema,
  address: evmAddressSchema,
})

export type ConnectWalletInput = z.infer<typeof connectWalletInputSchema>

export const walletConnectionSchema = z.object({
  connectionId: z.string(),
  provider: walletProviderSchema,
  network: walletNetworkSchema,
  address: z.string(),
})

export type WalletConnection = z.infer<typeof walletConnectionSchema>
