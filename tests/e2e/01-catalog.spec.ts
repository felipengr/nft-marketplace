import { expect, test } from './support/fixtures'

test.describe('Catálogo: busca, filtros, ordenação e paginação', () => {
  test('combina filtros, ordena e restaura o estado pelo histórico e refresh', async ({ app, page }) => {
    await app.start()
    await expect(app.catalogCards()).toHaveCount(9)

    let filters = await app.openFilters()
    await filters.getByRole('button', { name: /^Música/ }).click()
    await expect(page).toHaveURL(/categories=music/)
    await expect(app.catalogSummary()).toHaveText('11 NFTs encontrados')

    filters = app.isMobile ? page.getByRole('dialog', { name: 'Filtrar catálogo' }) : filters
    await filters.getByRole('button', { name: /^Ethereum/ }).click()
    await expect(page).toHaveURL(/networks=ethereum/)
    await expect(app.catalogSummary()).toHaveText('2 NFTs encontrados')
    await expect(filters.getByRole('button', { name: /^Música/ })).toHaveAttribute('aria-pressed', 'true')

    const sortScope = app.isMobile ? filters : page
    await sortScope.getByRole('combobox', { name: /Ordenar por/ }).click()
    await page.getByRole('option', { name: 'Maior preço' }).click()
    await expect(page).toHaveURL(/sort=price-desc/)
    await app.closeFilters()
    await expect(app.catalogCards().first()).toContainText('Emerald Ape #584')

    await page.goBack()
    await expect(page).not.toHaveURL(/sort=/)
    await expect(app.catalogCards().first()).toContainText('Golden Beat #207')
    await page.goBack()
    await expect(page).not.toHaveURL(/networks=/)
    await expect(app.catalogSummary()).toHaveText('11 NFTs encontrados')

    await page.reload()
    await expect(page).toHaveURL(/categories=music/)
    await expect(app.catalogSummary()).toHaveText('11 NFTs encontrados')
  })

  test('busca por texto pelo diálogo de busca', async ({ app, page }) => {
    await app.start()
    await page.getByRole('button', { name: 'Buscar NFTs' }).first().click()
    await page.getByLabel('Termo de busca').fill('golden')
    await page.getByLabel('Termo de busca').press('Enter')
    await expect(page).toHaveURL(/q=golden/)
    await expect(app.catalogSummary()).toHaveText('12 NFTs encontrados para “golden”')
    for (const name of await app.catalogCards().locator('h3').allTextContents()) {
      expect(name.toLowerCase()).toContain('golden')
    }
  })

  test('pagina, marca a página atual e reinicia a paginação ao mudar filtro', async ({ app, page }) => {
    await app.start()
    await app.open('/?page=3')
    await expect(page.getByRole('link', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
    const firstOnPage3 = await app.catalogCards().first().locator('h3').textContent()

    await page.getByRole('link', { name: 'Próxima página' }).click()
    await expect(page).toHaveURL(/page=4/)
    await expect(app.catalogCards().first().locator('h3')).not.toHaveText(firstOnPage3 ?? '')

    const filters = await app.openFilters()
    await filters.getByRole('button', { name: /^Polygon/ }).click()
    await expect(page).toHaveURL(/networks=polygon/)
    await expect(page).not.toHaveURL(/page=/)
  })

  test('trata resultado vazio e parâmetros inválidos na URL', async ({ app, page }) => {
    await app.start()
    await app.open('/?q=zzzz')
    await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
    await page.getByRole('button', { name: 'Limpar filtros' }).last().click()
    await expect(app.catalogCards()).toHaveCount(9)

    await app.open('/?sort=banana&tab=xyz&categories=foo,music&page=-2')
    await expect(app.catalogSummary()).toHaveText('11 NFTs encontrados')
  })

  test('descarta respostas fora de ordem e mantém o estado mais recente', async ({ app, page }) => {
    await app.start('out-of-order')
    await expect(app.catalogCards()).toHaveCount(9, { timeout: 15_000 })
    const filters = await app.openFilters()
    await filters.getByRole('button', { name: /^Música/ }).click()
    await filters.getByRole('button', { name: /^Fotografia/ }).click()
    await filters.getByRole('button', { name: /^Arte 3D/ }).click()
    await expect(page).toHaveURL(/3d-art/)
    await expect(app.catalogSummary()).toHaveText('23 NFTs encontrados', { timeout: 15_000 })
  })
})
