import { USERS, expect, test } from './support/fixtures'

test.describe('Tempo real (Socket.IO) durante o checkout', () => {
  test.beforeEach(async ({ app }) => {
    await app.start()
    await app.signIn(USERS.ana.email)
    await app.addToCart('emerald-ape-042', 1)
  })

  test('preço alterado durante a navegação é informado e impede cotação desatualizada', async ({ app, page }) => {
    await app.open('/')
    await expect(page.locator('a[href="/cart"]').first()).toHaveAttribute('aria-label', 'Carrinho, 1 item')
    await app.waitForRealtime()
    await app.mock('setPrice', 'emerald-ape-042', '1.49')
    await expect(app.catalogCards().first()).toContainText('1.49 ETH')
    await expect(page.getByText('O preço de Emerald Ape #042 mudou de 1.19 ETH para 1.49 ETH. Revise o carrinho antes de finalizar.')).toBeVisible()

    await app.open('/checkout')
    await app.waitForRealtime()
    await app.mock('setPrice', 'emerald-ape-042', '1.59')
    await expect(page.locator('aside').getByText('1.606 ETH')).toBeVisible()
    const dialog = await app.goToReview()
    await expect(dialog.getByRole('link', { name: 'Revisar itens no carrinho' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^Pagar / })).toHaveCount(0)

    await dialog.getByRole('link', { name: 'Revisar itens no carrinho' }).click()
    await expect(page.getByText('Seu carrinho mudou desde a última cotação')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()
    await page.getByRole('button', { name: 'Aceitar alterações e atualizar' }).click()
    await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeEnabled()
  })

  test('edição esgotada enquanto o carrinho está aberto bloqueia o checkout', async ({ app, page }) => {
    await app.open('/cart')
    await expect(page.getByText('Taxa de rede')).toBeVisible()
    await app.waitForRealtime()
    await app.mock('sellOut', 'emerald-ape-042', '1-of-50')
    await expect(page.getByText('Emerald Ape #042 (1/50) esgotou.').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()
    await page.getByRole('button', { name: 'Aceitar alterações e atualizar' }).click()
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })

  test('atualiza preço e disponibilidade no detalhe aberto', async ({ app, page }) => {
    await app.open('/nfts/emerald-ape-042')
    await app.waitForRealtime()
    await app.mock('setPrice', 'emerald-ape-042', '2.00')
    await expect(page.locator('main').getByText('2.00 ETH').filter({ visible: true }).first()).toBeVisible()
    await app.mock('sellOut', 'emerald-ape-042', '1-of-50')
    await expect(page.locator('input[value="1-of-50"]')).toBeDisabled()
  })
})
