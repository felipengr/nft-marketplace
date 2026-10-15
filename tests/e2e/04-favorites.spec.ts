import { USERS, expect, test } from './support/fixtures'

test.describe('Favoritos', () => {
  test('visitante é convidado a entrar ao favoritar', async ({ app, page }) => {
    await app.start()
    await app.open('/nfts/sage-nomad-009')
    const favorite = app.isMobile ? page.getByRole('button', { name: 'Favoritar', exact: true }).first() : page.getByRole('button', { name: 'Favoritar', exact: true })
    await favorite.click()
    if (app.isMobile) await expect(page).toHaveURL(/\/login\?redirect=/)
    else await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('favorita, persiste após refresh e lista em Lista de interesse', async ({ app, page }) => {
    await app.start()
    await app.signIn(USERS.ana.email)
    await app.open('/nfts/sage-nomad-009')
    const toggle = page.locator('main').getByRole('button', { name: /^Favoritar$|^Favoritado$|^Remover dos favoritos$/ }).first()
    await toggle.click()
    await expect(page.getByText('Sage Nomad #009 adicionado aos favoritos.')).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await page.reload()
    await expect(page.locator('main').locator('[aria-pressed="true"]').first()).toBeVisible()
    await app.open('/favorites')
    await expect(page.getByText('1 NFT salvo')).toBeVisible()
    await expect(page.locator('main ul li h3')).toHaveText(['Sage Nomad #009'])
  })

  test('falha na mutation desfaz a atualização otimista e a nova tentativa funciona', async ({ app, page }) => {
    await app.start()
    await app.signIn(USERS.ana.email)
    await app.open('/nfts/sage-nomad-009')
    await app.mock('useScenario', 'slow')
    await app.mock('fail', { path: '/api/favorites/*', method: 'PUT', mode: 500, times: 1 })
    const toggle = page.locator('main').getByRole('button', { name: /^Favoritar$|^Favoritado$|^Remover dos favoritos$/ }).first()
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByText(/Não foi possível favoritar Sage Nomad #009/)).toBeVisible({ timeout: 15_000 })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await app.mock('useScenario', 'fast')
    await toggle.click()
    await expect(page.getByText('Sage Nomad #009 adicionado aos favoritos.')).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })
})
