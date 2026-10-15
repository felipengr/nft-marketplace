import { USERS, expect, test, type App } from './support/fixtures'

async function prepareCheckout(app: App, scenario: string) {
  await app.start(scenario)
  await app.signIn(USERS.ana.email)
  await app.addToCart('emerald-ape-042', 1)
  await app.addToCart('sage-nomad-009', 1)
  await app.open('/checkout')
}

test.describe('Falhas de pagamento e idempotência', () => {
  test('pagamento recusado preserva os itens no carrinho', async ({ app, page }) => {
    await prepareCheckout(app, 'payment-rejected')
    await app.connectAndPay(await app.goToReview())
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({ timeout: 15_000 })
    const db = await app.db()
    expect(db.orders[0].status).toBe('rejected')
    expect(db.carts.find((cart) => cart.ownerId === 'usr_ana')?.items).toHaveLength(2)
    await page.getByRole('link', { name: 'Voltar ao carrinho' }).click()
    await expect(page.locator('main ul li h3')).toHaveCount(2)
  })

  test('carteira que recusa a conexão não cria pedido', async ({ app, page }) => {
    await prepareCheckout(app, 'wallet-rejected')
    const dialog = await app.goToReview()
    await dialog.getByRole('button', { name: /^Conectar / }).click()
    await expect(dialog.getByRole('alert')).toContainText('A conexão foi recusada na carteira.')
    expect((await app.db()).orders).toHaveLength(0)
    await expect(page).toHaveURL(/\/checkout$/)
  })

  test('cliques repetidos criam um único pedido', async ({ app, page }) => {
    await prepareCheckout(app, 'fast')
    const dialog = await app.goToReview()
    await dialog.getByRole('button', { name: /^Conectar / }).click()
    await expect(dialog.getByText('Carteira conectada')).toBeVisible()
    const pay = dialog.getByRole('button', { name: /^Pagar / })
    await expect(pay).toBeEnabled()
    await pay.evaluate((button: HTMLButtonElement) => {
      button.click()
      button.click()
      button.click()
    })
    await expect(page).toHaveURL(/\/orders\/ord_/)
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 15_000 })
    expect((await app.db()).orders).toHaveLength(1)
  })

  test('timeout após criar o pedido recupera o mesmo pedido no reenvio', async ({ app, page }) => {
    test.setTimeout(60_000)
    await prepareCheckout(app, 'order-timeout')
    const dialog = await app.goToReview()
    await app.connectAndPay(dialog)
    await expect(dialog.getByRole('alert')).toContainText('Não recebemos a resposta do servidor.', { timeout: 20_000 })
    expect((await app.db()).orders).toHaveLength(1)

    await dialog.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page).toHaveURL(/\/orders\/ord_/)
    const orders = (await app.db()).orders
    expect(orders).toHaveLength(1)
    expect(page.url()).toContain(orders[0].id)
  })

  test('mesma chave de idempotência com conteúdo diferente gera conflito', async ({ app }) => {
    await prepareCheckout(app, 'fast')
    const cart = await app.api<{ version: number }>('GET', '/cart')
    const quote = await app.api<{ total: string }>('GET', '/cart/quote')
    const connection = await app.api<{ connectionId: string }>('POST', '/wallet-connections', {
      provider: 'metamask',
      network: 'ethereum',
      address: '0xA91F3c6B2d8E4f71a0B5C9d2E3F4a5B6c7D8E82C',
    })
    const body = (note: string) => ({
      buyer: { displayName: 'Ana Lima', username: 'ana.lima', profileName: 'Ana Lima', email: USERS.ana.email, ensName: 'analima' },
      wallet: { walletId: 'wal_ana_primary', address: '0xA91F3c6B2d8E4f71a0B5C9d2E3F4a5B6c7D8E82C', network: 'ethereum', secondary: null },
      provider: 'metamask',
      connectionId: connection.body.connectionId,
      referralCode: null,
      note,
      expected: { cartVersion: cart.body.version, total: quote.body.total },
    })
    const send = (payload: unknown) =>
      app.page.evaluate(async (data) => {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('kurio.session-token')}`,
            'Idempotency-Key': 'ord-fixed-key-for-conflict-test',
          },
          body: JSON.stringify(data),
        })
        return { status: response.status, body: await response.json() }
      }, payload)

    const first = await send(body('primeira'))
    const replay = await send(body('primeira'))
    const conflict = await send(body('diferente'))
    expect(first.status).toBe(201)
    expect(replay.status).toBe(200)
    expect(replay.body.id).toBe(first.body.id)
    expect(conflict.status).toBe(409)
    expect(conflict.body.error.fields.reason).toBe('idempotency-conflict')
  })

  test('preço alterado no envio exige nova confirmação', async ({ app, page }) => {
    await prepareCheckout(app, 'checkout-price-change')
    const dialog = await app.goToReview()
    await app.connectAndPay(dialog)
    await expect(dialog.getByRole('alert')).toContainText('confirme novamente')
    expect((await app.db()).orders).toHaveLength(0)
    await expect(dialog.getByRole('link', { name: 'Revisar itens no carrinho' })).toBeVisible()

    await dialog.getByRole('link', { name: 'Revisar itens no carrinho' }).click()
    await page.getByRole('button', { name: 'Aceitar alterações e atualizar' }).click()
    await expect(page.getByText('Seu carrinho mudou desde a última cotação')).toBeHidden()
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    const second = await app.goToReview()
    await expect(second.getByText('1.24 ETH', { exact: true })).toBeVisible()
    await app.connectAndPay(second)
    await expect(page).toHaveURL(/\/orders\/ord_/)
  })

  test('edição esgotada durante a compra bloqueia o pedido', async ({ app }) => {
    await prepareCheckout(app, 'checkout-sold-out')
    const dialog = await app.goToReview()
    await app.connectAndPay(dialog)
    await expect(dialog.getByRole('alert')).toContainText('esgotou')
    expect((await app.db()).orders).toHaveLength(0)
  })
})
