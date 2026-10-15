import { test as base, expect, type Locator, type Page, type TestInfo } from '@playwright/test'

export const PASSWORD = 'Kurio@2026'

export const USERS = {
  ana: { email: 'ana@kurio.dev', name: 'Ana Lima' },
  bruno: { email: 'bruno@kurio.dev', name: 'Bruno Costa' },
} as const

type FailureRule = { path: string; method?: string; mode: number | 'network-error' | 'timeout'; times?: number }

type MockControls = {
  scenario: () => string
  useScenario: (name: string) => void
  fail: (rule: FailureRule) => void
  hold: (path: string) => void
  release: () => void
  expireSessions: () => void
  setPrice: (nftId: string, price: string) => unknown
  sellOut: (nftId: string, editionId?: string) => unknown
  replayLastEvent: () => string | null
  emitStaleEvent: (nftId: string, price: string) => string
  dropRealtime: () => number
  realtimeConnections: () => number
}

type MockDb = {
  orders: Array<{ id: string; status: string; userId: string }>
  carts: Array<{ ownerId: string | null; items: Array<{ nftId: string; quantity: number }> }>
  nfts: Array<{ id: string; price: string; editions: Array<{ id: string; available: number }> }>
}

declare global {
  interface Window {
    __kurioMocks?: MockControls
  }
}

export class App {
  readonly page: Page
  readonly isMobile: boolean

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page
    this.isMobile = testInfo.project.name.startsWith('mobile')
  }

  async start(scenario = 'fast'): Promise<void> {
    await this.page.goto(`/?mock-reset&mock-scenario=${scenario}&mock-panel=off`)
    await this.page.waitForFunction(() => Boolean(window.__kurioMocks))
    await this.page.locator('#conteudo').waitFor()
  }

  async open(path: string): Promise<void> {
    await this.page.goto(path)
    await this.page.waitForFunction(() => Boolean(window.__kurioMocks))
    await this.page.locator('#conteudo').waitFor()
  }

  async signIn(email: string, password = PASSWORD): Promise<void> {
    const token = await this.page.evaluate(
      async ({ email: address, password: secret }) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: address, password: secret }),
        })
        const body = (await response.json()) as { token: string }
        return body.token
      },
      { email, password },
    )
    await this.page.evaluate((value) => localStorage.setItem('kurio.session-token', value), token)
  }

  async api<T = unknown>(method: string, path: string, body?: unknown): Promise<{ status: number; body: T }> {
    return this.page.evaluate(
      async ({ method: verb, path: url, body: payload }) => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        const token = localStorage.getItem('kurio.session-token')
        if (token) headers.Authorization = `Bearer ${token}`
        let guest = localStorage.getItem('kurio.guest-cart-id')
        if (!guest) {
          guest = `guest_${crypto.randomUUID().replace(/-/g, '')}`
          localStorage.setItem('kurio.guest-cart-id', guest)
        }
        headers['X-Cart-Id'] = guest
        const response = await fetch(`/api${url}`, { method: verb, headers, body: payload === undefined ? undefined : JSON.stringify(payload) })
        const text = await response.text()
        return { status: response.status, body: text ? JSON.parse(text) : null }
      },
      { method, path, body },
    )
  }

  async addToCart(nftId: string, quantity = 1, editionId?: string): Promise<void> {
    const result = await this.api('POST', '/cart/items', { nftId, quantity, editionId })
    expect(result.status, `add ${nftId} to cart`).toBe(201)
  }

  async db(): Promise<MockDb> {
    return this.page.evaluate(() => JSON.parse(localStorage.getItem('kurio.mock-db') ?? '{}') as MockDb)
  }

  mock<K extends keyof MockControls>(name: K, ...args: Parameters<MockControls[K]>): Promise<ReturnType<MockControls[K]>> {
    return this.page.evaluate(
      ({ name: control, args: values }) => {
        const controls = window.__kurioMocks as unknown as Record<string, (...input: unknown[]) => unknown>
        return controls[control](...values)
      },
      { name, args: args as unknown[] },
    ) as Promise<ReturnType<MockControls[K]>>
  }

  async waitForRealtime(): Promise<void> {
    await this.page.waitForFunction(() => (window.__kurioMocks?.realtimeConnections() ?? 0) > 0)
  }

  catalogCards(): Locator {
    return this.page.locator('#catalogo ul.grid > li')
  }

  catalogSummary(): Locator {
    return this.page.locator('#catalogo p[aria-atomic="true"]')
  }

  async openFilters(): Promise<Locator> {
    if (!this.isMobile) return this.page.getByRole('complementary', { name: 'Filtros do catálogo' })
    await this.page.getByRole('button', { name: /^Filtros/ }).click()
    const sheet = this.page.getByRole('dialog', { name: 'Filtrar catálogo' })
    await expect(sheet).toBeVisible()
    return sheet
  }

  async closeFilters(): Promise<void> {
    if (!this.isMobile) return
    await this.page.keyboard.press('Escape')
    await expect(this.page.getByRole('dialog', { name: 'Filtrar catálogo' })).toBeHidden()
  }

  async submitLogin(email: string, password = PASSWORD): Promise<void> {
    const dialog = this.page.getByRole('dialog')
    const scope = (await dialog.isVisible()) ? dialog : this.page.locator('main')
    await scope.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email)
    await scope.getByLabel('Senha', { exact: true }).fill(password)
    await scope.locator('form button[type=submit]').click()
  }

  async goToReview(): Promise<Locator> {
    const submit = this.page.locator('form#checkout-form button[type=submit]')
    const mobileSubmit = this.page.getByRole('button', { name: 'Confirmar compra' }).last()
    await expect(this.page.getByRole('textbox', { name: 'Nome de exibição', exact: true })).toBeVisible()
    const button = this.isMobile ? mobileSubmit : submit
    await expect(button).toBeEnabled()
    await button.click()
    const dialog = this.page.getByRole('dialog', { name: 'Revise seu pedido' })
    await expect(dialog).toBeVisible()
    return dialog
  }

  async connectAndPay(dialog: Locator): Promise<void> {
    await dialog.getByRole('button', { name: /^Conectar / }).click()
    await expect(dialog.getByText('Carteira conectada')).toBeVisible()
    await dialog.getByRole('button', { name: /^Pagar / }).click()
  }
}

export const test = base.extend<{ app: App }>({
  app: async ({ page }, use, testInfo) => {
    await use(new App(page, testInfo))
  },
})

export { expect }
