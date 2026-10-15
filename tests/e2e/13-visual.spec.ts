import { USERS, expect, test, type App } from './support/fixtures'

async function settle(app: App) {
  await app.page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 60))
    }
    window.scrollTo(0, 0)
  })
  await app.page.evaluate(() => document.fonts.ready)
  await app.page.waitForFunction(() => Array.from(document.images).filter((image) => image.getClientRects().length > 0).every((image) => image.complete))
  await app.page.waitForTimeout(300)
}

test.describe('Regressão visual @visual', () => {
  test('início', async ({ app, page }) => {
    await app.start()
    await expect(app.catalogCards()).toHaveCount(9)
    await settle(app)
    await expect(page).toHaveScreenshot('home.png', { fullPage: true })
  })

  test('detalhe do NFT', async ({ app, page }) => {
    await app.start()
    await app.open('/nfts/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.locator('section[aria-labelledby="related-title"] li').first()).toBeVisible()
    await settle(app)
    await expect(page).toHaveScreenshot('nft-detail.png', { fullPage: true })
  })

  test('carrinho', async ({ app, page }) => {
    await app.start()
    await app.addToCart('emerald-ape-042', 2)
    await app.addToCart('violet-nomad-314', 1)
    await app.addToCart('ivory-baron-088', 2, '1-of-10')
    await app.open('/cart')
    await expect(page.getByText('Taxa de rede')).toBeVisible()
    await expect(page.locator('section[aria-labelledby="related-title"] li').first()).toBeVisible()
    await settle(app)
    await expect(page).toHaveScreenshot('cart.png', { fullPage: true })
  })

  test('pagamento', async ({ app, page }) => {
    await app.start()
    await app.signIn(USERS.ana.email)
    await app.addToCart('emerald-ape-042', 2)
    await app.addToCart('violet-nomad-314', 1)
    await app.open('/checkout')
    await expect(page.getByRole('textbox', { name: 'Nome de exibição', exact: true })).toHaveValue('Ana Lima')
    await expect(page.getByText('Taxa estimada')).toBeVisible()
    await settle(app)
    await expect(page).toHaveScreenshot('checkout.png', { fullPage: true })
  })
})
