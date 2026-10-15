import { USERS, expect, test } from './support/fixtures'

test.describe('Compra completa', () => {
  test('do catálogo ao recibo confirmado', async ({ app, page }) => {
    await app.start()
    await app.catalogCards().first().locator('h3 a').click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()

    const buy = app.isMobile ? page.getByRole('button', { name: 'Comprar NFT', exact: true }) : page.getByRole('button', { name: 'COMPRAR', exact: true })
    await buy.click()
    await expect(page).toHaveURL(/\/cart$/)
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await app.submitLogin(USERS.ana.email)
    await expect(page).toHaveURL(/\/checkout$/)

    const dialog = await app.goToReview()
    await expect(dialog.getByText('Emerald Ape #042')).toBeVisible()
    await expect(dialog.getByText('1.206 ETH').first()).toBeVisible()
    await app.connectAndPay(dialog)

    await expect(page).toHaveURL(/\/orders\/ord_/)
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute('href', /^https:\/\/etherscan\.io\/tx\/0x[0-9a-f]{64}$/)
    await expect(page.getByRole('cell', { name: '1.19 ETH' })).toBeVisible()

    const db = await app.db()
    expect(db.orders).toHaveLength(1)
    expect(db.orders[0].status).toBe('confirmed')
    const edition = db.nfts.find((nft) => nft.id === 'emerald-ape-042')?.editions.find((item) => item.id === '1-of-50')
    expect(edition?.available).toBe(23)
    expect(db.carts.find((cart) => cart.ownerId === 'usr_ana')?.items).toEqual([])
  })

  test('o recibo é um snapshot e não muda com o catálogo', async ({ app, page }) => {
    await app.start()
    await app.signIn(USERS.ana.email)
    await app.addToCart('sage-nomad-009', 1)
    await app.open('/checkout')
    await app.connectAndPay(await app.goToReview())
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible({ timeout: 15_000 })

    await app.mock('setPrice', 'sage-nomad-009', '9.99')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    await expect(page.getByRole('cell', { name: '1.69 ETH' })).toBeVisible()
    await expect(page.getByText('9.99 ETH')).toHaveCount(0)
  })

  test('valida os campos do pagamento antes da revisão', async ({ app, page }) => {
    await app.start()
    await app.signIn(USERS.ana.email)
    await app.addToCart('golden-beat-207', 1)
    await app.open('/checkout')
    await page.getByRole('textbox', { name: 'Endereço da carteira' }).fill('0x123')
    await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('ana@')
    const submit = app.isMobile ? page.getByRole('button', { name: 'Confirmar compra' }).last() : page.locator('form#checkout-form button[type=submit]')
    await submit.click()
    await expect(page.getByText('Informe um endereço 0x válido com 40 caracteres hexadecimais.')).toBeVisible()
    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Revise seu pedido' })).toHaveCount(0)
  })
})
