import { USERS, expect, test } from './support/fixtures'

test.describe('Skeletons, falhas e recuperação', () => {
  test('mostra skeletons no catálogo e no detalhe enquanto a API não responde', async ({ app, page }) => {
    await app.start()
    await app.mock('hold', '/api/nfts*')
    await app.open('/?tab=trending')
    const catalog = page.locator('#catalogo')
    await expect(catalog.locator('[data-slot="skeleton"]').filter({ visible: true }).first()).toBeVisible()
    await expect(catalog.locator('[aria-busy="true"]').first()).toBeAttached()
    await app.mock('release')
    await expect(app.catalogCards().first()).toBeVisible()
    await expect(catalog.locator('[data-slot="skeleton"]')).toHaveCount(0)

    await app.mock('hold', '/api/nfts/*')
    await app.open('/nfts/ivory-baron-088')
    await expect(page.getByLabel('Carregando NFT')).toBeVisible()
    await app.mock('release')
    await expect(page.getByRole('heading', { level: 1, name: 'Ivory Baron #088' })).toBeVisible()
  })

  test('skeleton do resumo do carrinho enquanto a cotação carrega', async ({ app, page }) => {
    await app.start()
    await app.signIn(USERS.ana.email)
    await app.addToCart('emerald-ape-042', 1)
    await app.mock('hold', '/api/cart/quote')
    await app.open('/cart')
    const summary = page.locator('section[aria-labelledby="summary-title"]')
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
    await expect(summary.locator('[data-slot="skeleton"]').first()).toBeVisible()
    await app.mock('release')
    await expect(summary.getByText('Taxa de rede')).toBeVisible()
    await expect(summary.locator('[data-slot="skeleton"]')).toHaveCount(0)
  })

  test('respeita a preferência por movimento reduzido no shimmer', async ({ app, page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await app.start()
    await app.mock('hold', '/api/nfts*')
    await app.open('/')
    const skeleton = page.locator('#catalogo [data-slot="skeleton"]').filter({ visible: true }).first()
    await expect(skeleton).toBeVisible()
    expect(await skeleton.evaluate((element) => getComputedStyle(element, '::after').animationName)).toBe('none')
    await app.mock('release')
  })

  test('exibe erro após falhas e recupera com nova tentativa', async ({ app, page }) => {
    await app.start()
    await app.mock('useScenario', 'server-error')
    await app.open('/?tab=new')
    await expect(page.getByRole('heading', { name: 'Não foi possível carregar o catálogo' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('alert').first()).toContainText('Erro interno no servidor.')
    await app.mock('useScenario', 'fast')
    await page.getByRole('button', { name: 'Tentar novamente' }).first().click()
    await expect(app.catalogCards()).toHaveCount(9)
  })

  test('falha transitória é recuperada automaticamente por retry', async ({ app, page }) => {
    await app.start('flaky')
    await expect(app.catalogCards().first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Não foi possível carregar o catálogo' })).toHaveCount(0)
  })

  test('sem conexão mostra feedback e recupera', async ({ app, page }) => {
    await app.start()
    await app.mock('useScenario', 'offline')
    await app.open('/nfts/sage-nomad-009')
    await expect(page.getByText('Sem conexão com o servidor. Verifique sua internet e tente novamente.')).toBeVisible({ timeout: 20_000 })
    await app.mock('useScenario', 'fast')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Sage Nomad #009' })).toBeVisible()
  })
})
