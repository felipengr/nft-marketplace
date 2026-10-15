import { request } from './http-client'
import { walletConnectionSchema, walletsResponseSchema, type ConnectWalletInput } from './contracts/wallet'

export function fetchWallets(signal?: AbortSignal) {
  return request(walletsResponseSchema, { method: 'GET', url: '/wallets', signal })
}

export function connectWallet(input: ConnectWalletInput) {
  return request(walletConnectionSchema, { method: 'POST', url: '/wallet-connections', data: input })
}
