import { USERS, expect, test } from './support/fixtures'

test.describe('Carrinho', () => {
  test('altera quantidades, remove itens e mantém o carrinho após refresh', async ({ app, page }) => {
    await app.start()
    await app.addToCart('emerald-ape-042', 1)
    await app.addToCart('sage-nomad-009', 1)
    await app.open('/cart')
    const summary = page.locator('section[aria-labelledby="summary-title"]')
    await expect(summary.getByText('2.88 ETH')).toBeVisible()

    await page.getByRole('group', { name: 'Quantidade de Emerald Ape #042' }).getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(summary.getByText('4.07 ETH')).toBeVisible()
    await expect(summary.getByText('4.086 ETH')).toBeVisible()

    await page.getByRole('button', { name: 'Remover Sage Nomad #009 do carrinho' }).click()
    await expect(page.getByText('Sage Nomad #009 removido do carrinho.')).toBeVisible()
    await expect(summary.getByText('2.38 ETH')).toBeVisible()

    await page.reload()
    await expect(summary.getByText('2.38 ETH')).toBeVisible()
    await expect(page.getByRole('group', { name: 'Quantidade de Emerald Ape #042' }).locator('output')).toHaveText('2')
  })

  test('respeita a disponibilidade da edição', async ({ app, page }) => {
    await app.start()
    await app.addToCart('emerald-ape-042', 3, '1-of-10')
    await app.open('/cart')
    const plus = page.getByRole('group', { name: 'Quantidade de Emerald Ape #042' }).getByRole('button', { name: 'Aumentar quantidade' })
    await expect(plus).toBeDisabled()
    const conflict = await app.api('POST', '/cart/items', { nftId: 'emerald-ape-042', editionId: '1-of-10', quantity: 1 })
    expect(conflict.status).toBe(409)
  })

  test('aplica e remove cupom, tratando código inválido e expirado', async ({ app, page }) => {
    await app.start()
    await app.addToCart('emerald-ape-042', 2)
    await app.open('/cart')
    const summary = page.locator('section[aria-labelledby="summary-title"]')
    const coupon = page.getByLabel('Código promocional')

    await coupon.fill('nada')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Cupom inválido. Confira o código e tente novamente.')).toBeVisible()
    await expect(coupon).toHaveAttribute('aria-invalid', 'true')

    await coupon.fill('bemvindo')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Este cupom expirou.')).toBeVisible()

    await coupon.fill('kurio10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(summary.getByText('(-) 0.238 ETH')).toBeVisible()
    await expect(summary.getByText('2.158 ETH')).toBeVisible()

    await page.getByRole('button', { name: 'Remover cupom KURIO10' }).click()
    await expect(summary.getByText('(-) 0.00 ETH')).toBeVisible()
    await expect(summary.getByText('2.396 ETH')).toBeVisible()
  })

  test('preserva os itens do visitante ao autenticar', async ({ app, page }) => {
    await app.start()
    await app.addToCart('golden-beat-207', 2)
    await app.open('/cart')
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await app.submitLogin(USERS.ana.email)
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.getByText('Os itens do seu carrinho foram mantidos na sua conta.')).toBeVisible()
    const db = await app.db()
    const anaCart = db.carts.find((cart) => cart.ownerId === 'usr_ana')
    expect(anaCart?.items).toEqual([expect.objectContaining({ nftId: 'golden-beat-207', quantity: 2 })])
  })
})
