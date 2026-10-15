import { request, requestVoid } from './http-client'
import {
  walletConnectionSchema,
  walletSchema,
  walletsResponseSchema,
  type ConnectWalletInput,
  type UpsertWalletInput,
  type WalletKind,
} from './contracts/wallet'

export function fetchWallets(signal?: AbortSignal) {
  return request(walletsResponseSchema, { method: 'GET', url: '/wallets', signal })
}

export function connectWallet(input: ConnectWalletInput) {
  return request(walletConnectionSchema, { method: 'POST', url: '/wallet-connections', data: input })
}

export function saveWallet(kind: WalletKind, input: UpsertWalletInput) {
  return request(walletSchema, { method: 'PUT', url: `/wallets/${kind}`, data: input })
}

export function deleteWallet(kind: WalletKind) {
  return requestVoid({ method: 'DELETE', url: `/wallets/${kind}` })
}
