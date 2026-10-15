import { USERS, expect, test } from './support/fixtures'

test.describe('Eventos duplicados, antigos, desconexão e pedido pendente', () => {
  test('ignora eventos duplicados e antigos sem regredir o estado', async ({ app, page }) => {
    await app.start()
    await app.open('/nfts/emerald-ape-042')
    await app.waitForRealtime()
    await app.mock('setPrice', 'emerald-ape-042', '1.69')
    await expect(page.locator('main').getByText('1.69 ETH').filter({ visible: true }).first()).toBeVisible()

    const replayed = await app.mock('replayLastEvent')
    expect(replayed).not.toBeNull()
    await app.mock('emitStaleEvent', 'emerald-ape-042', '9.99')
    await page.waitForTimeout(500)
    await expect(page.getByText('9.99 ETH')).toHaveCount(0)
    await expect(page.locator('main').getByText('1.69 ETH').filter({ visible: true }).first()).toBeVisible()
  })

  test('reconecta após queda e reconcilia mudanças perdidas pela API REST', async ({ app, page }) => {
    await app.start()
    await app.waitForRealtime()
    await app.mock('dropRealtime')
    await app.mock('setPrice', 'sage-nomad-009', '2.22')
    await expect(page.getByText('Conexão em tempo real restabelecida. Dados atualizados.')).toBeVisible({ timeout: 20_000 })
    await expect(app.catalogCards().nth(1)).toContainText('2.22 ETH')
  })

  test('pedido pendente é retomado após refresh e queda de conexão sem duplicar a compra', async ({ app, page }) => {
    await app.start('default')
    await app.signIn(USERS.ana.email)
    await app.addToCart('golden-beat-207', 1)
    await app.open('/checkout')
    await app.connectAndPay(await app.goToReview())
    await expect(page).toHaveURL(/\/orders\/ord_/)
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação na rede' })).toBeVisible()

    await page.reload()
    await app.waitForRealtime()
    await app.mock('dropRealtime')
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 20_000 })
    const db = await app.db()
    expect(db.orders).toHaveLength(1)
    expect(db.orders[0].status).toBe('confirmed')
  })

  test('eventos do pedido de um usuário não chegam à sessão do próximo usuário', async ({ app, page }) => {
    await app.start('default')
    await app.signIn(USERS.ana.email)
    await app.addToCart('golden-beat-207', 1)
    await app.open('/checkout')
    await app.connectAndPay(await app.goToReview())
    await expect(page.getByRole('heading', { name: 'Aguardando confirmação na rede' })).toBeVisible()

    await app.api('POST', '/auth/logout')
    await app.signIn(USERS.bruno.email)
    await app.open('/')
    await app.waitForRealtime()
    await expect.poll(async () => (await app.db()).orders[0].status, { timeout: 15_000 }).toBe('confirmed')
    await page.waitForTimeout(1_000)
    await expect(page.getByText(/Pagamento confirmado/)).toHaveCount(0)
    await expect(page).toHaveURL(/\/$/)
  })
})
