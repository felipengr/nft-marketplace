import AxeBuilder from '@axe-core/playwright'
import { USERS, expect, test, type App } from './support/fixtures'

async function expectNoViolations(app: App, label: string) {
  await expect(app.page.locator('main [aria-busy="true"]')).toHaveCount(0)
  await expect(app.page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 8_000 })
  const results = await new AxeBuilder({ page: app.page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).exclude('#kurio-simulation-panel').analyze()
  const summary = results.violations.map((violation) => {
    const nodes = violation.nodes.map((node) => `${node.target.join(' ')} | ${node.failureSummary?.split('\n')[1]?.trim() ?? ''}`)
    return `${violation.id}: ${violation.help} -> ${nodes.join(' ; ')}`
  })
  expect(summary, `${label} sem violações de acessibilidade`).toEqual([])
}

test.describe('Acessibilidade', () => {
  test.use({ reducedMotion: 'reduce' })

  test('páginas principais sem violações WCAG A/AA detectáveis', async ({ app, page }) => {
    await app.start()
    await expect(app.catalogCards()).toHaveCount(9)
    await expectNoViolations(app, 'Início')

    await app.open('/nfts/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expectNoViolations(app, 'Detalhe')

    await app.signIn(USERS.ana.email)
    await app.addToCart('emerald-ape-042', 1)
    await app.open('/cart')
    await expect(page.getByText('Taxa de rede')).toBeVisible()
    await expectNoViolations(app, 'Carrinho')

    await app.open('/checkout')
    await expect(page.getByRole('textbox', { name: 'Nome de exibição', exact: true })).toBeVisible()
    await expectNoViolations(app, 'Pagamento')

    await app.open('/account')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await expectNoViolations(app, 'Perfil')
  })

  test('navegação por teclado com link de pular e foco visível', async ({ app, page }) => {
    test.skip(app.isMobile, 'Navegação por teclado físico avaliada no desktop')
    await app.start()
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#conteudo$/)

    await page.locator('header a').first().focus()
    await page.keyboard.press('Tab')
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle)
    expect(outline).not.toBe('none')

    const card = app.catalogCards().first().locator('h3 a')
    await card.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/nfts\/emerald-ape-042/)
  })

  test('diálogos prendem e devolvem o foco', async ({ app, page }) => {
    test.skip(app.isMobile, 'O login no mobile é uma página, não um diálogo')
    await app.start()
    const trigger = page.locator('header').getByRole('button', { name: 'Entrar' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    for (let index = 0; index < 15; index += 1) {
      await page.keyboard.press('Tab')
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[role=dialog]')))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('erros de formulário são anunciados e associados aos campos', async ({ app, page }) => {
    await app.start()
    await app.open('/login')
    await page.locator('main form button[type=submit]').click()
    const email = page.locator('main').getByRole('textbox', { name: 'E-mail', exact: true })
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    const describedBy = await email.getAttribute('aria-describedby')
    await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Informe um e-mail válido.')
    await expect(email).toBeFocused()
  })
})
