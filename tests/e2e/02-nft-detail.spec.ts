import { expect, test } from './support/fixtures'

test.describe('Detalhe do NFT', () => {
  test('acesso direto mostra galeria, informações, edição e limite de quantidade', async ({ app, page }) => {
    await app.start()
    await app.open('/nfts/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page).toHaveTitle('Emerald Ape #042 — Kurio')
    await expect(page.locator('input[value="1-of-50"]')).toBeChecked()
    await expect(page.locator('input[value="1-of-1"]')).toBeDisabled()

    await page.locator('label:has(input[value="1-of-10"])').click()
    await expect(page).toHaveURL(/edition=1-of-10/)
    const stepper = page.getByRole('group', { name: 'Quantidade' }).first()
    const plus = stepper.getByRole('button', { name: 'Aumentar quantidade' })
    await plus.click()
    await plus.click()
    await expect(stepper.locator('output')).toHaveText('3')
    await expect(plus).toBeDisabled()

    await page.reload()
    await expect(page.locator('input[value="1-of-10"]')).toBeChecked()
  })

  test('abre avaliações e navega para outro NFT da coleção', async ({ app, page }) => {
    test.skip(app.isMobile, 'O atalho de avaliações e as miniaturas fazem parte do layout desktop')
    await app.start()
    await app.open('/nfts/emerald-ape-042')
    await page.getByRole('button', { name: /avaliações/ }).click()
    await expect(page.getByText('Média 4,8 de 5 em 19 avaliações')).toBeVisible()
    await page.getByRole('button', { name: 'Ver imagem 2 de 4' }).click()
    await expect(page.getByRole('button', { name: 'Ver imagem 2 de 4' })).toHaveAttribute('aria-pressed', 'true')

    const related = page.locator('section[aria-labelledby="related-title"]')
    await related.locator('li h3 a').first().click()
    await expect(page).toHaveURL(/\/nfts\/emerald-ape-834/)
  })

  test('NFT inexistente e rota inexistente exibem páginas de não encontrado', async ({ app, page }) => {
    await app.start()
    await app.open('/nfts/nao-existe')
    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await app.open('/rota/que/nao/existe')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
    await page.getByRole('link', { name: 'Voltar para o início' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('edição esgotada não pode ser comprada', async ({ app, page }) => {
    await app.start()
    await app.mock('sellOut', 'emerald-ape-042')
    await app.open('/nfts/emerald-ape-042')
    await expect(page.locator('input[value="1-of-50"]')).toBeDisabled()
    const buy = app.isMobile ? page.getByRole('button', { name: 'Edição esgotada' }) : page.getByRole('button', { name: 'COMPRAR', exact: true })
    await expect(buy).toBeDisabled()
  })
})
