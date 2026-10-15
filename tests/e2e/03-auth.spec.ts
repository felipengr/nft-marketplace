import { USERS, expect, test } from './support/fixtures'

test.describe('Cadastro, login, sessão e troca de usuário', () => {
  test('cadastro valida campos, trata conflito e autentica', async ({ app, page }) => {
    await app.start()
    if (app.isMobile) {
      await app.open('/register')
    } else {
      await page.locator('header').getByRole('button', { name: 'Entrar' }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Criar conta' }).first().click()
    }
    const scope = app.isMobile ? page.locator('main') : page.getByRole('dialog')
    const submit = scope.locator('form button[type=submit]')

    await submit.click()
    await expect(scope.getByText('O nome de usuário deve ter pelo menos 3 caracteres.')).toBeVisible()

    await scope.getByRole('textbox', { name: 'Nome de usuário' }).fill('ana.lima')
    await scope.getByRole('textbox', { name: 'E-mail', exact: true }).fill(USERS.ana.email)
    await scope.getByLabel('Senha', { exact: true }).fill('senha1234')
    await scope.getByLabel('Confirmar senha').fill('senha9999')
    await submit.click()
    await expect(scope.getByText('As senhas não coincidem.')).toBeVisible()

    await scope.getByLabel('Confirmar senha').fill('senha1234')
    await submit.click()
    await expect(scope.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(scope.getByText('Este nome de usuário já está em uso.')).toBeVisible()

    await scope.getByRole('textbox', { name: 'Nome de usuário' }).fill('carla.dev')
    await scope.getByRole('textbox', { name: 'E-mail', exact: true }).fill('carla@kurio.dev')
    await submit.click()
    await expect(page.getByText('Conta criada com sucesso. Bem-vindo à Kurio!')).toBeVisible()
    const stored = await page.evaluate(() => localStorage.getItem('kurio.mock-db') ?? '')
    expect(stored).not.toContain('senha1234')
  })

  test('login rejeita credenciais erradas e retorna ao fluxo anterior', async ({ app, page }) => {
    await app.start()
    await app.open('/account/wallets')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    await app.submitLogin(USERS.ana.email, 'errada123')
    await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha inválidos.' })).toBeVisible()
    await app.submitLogin(USERS.ana.email)
    await expect(page).toHaveURL(/\/account\/wallets$/)
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()
  })

  test('expiração de sessão durante a navegação preserva o contexto para retomada', async ({ app, page }) => {
    await page.clock.install()
    await app.start('short-session')
    await app.signIn(USERS.ana.email)
    await app.open('/account')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await page.clock.fastForward(31_000)
    await expect(page).toHaveURL(/\/login\?.*reason=expired/)
    await expect(page.getByText('Sua sessão expirou. Entre novamente para continuar de onde parou.')).toBeVisible()
    await app.submitLogin(USERS.ana.email)
    await expect(page).toHaveURL(/\/account$/)
  })

  test('logout e troca de usuário limpam dados privados do usuário anterior', async ({ app, page }) => {
    test.skip(app.isMobile, 'O menu da conta no header existe apenas no desktop')
    await app.start()
    await app.signIn(USERS.ana.email)
    await app.addToCart('emerald-ape-042', 2)
    await app.open('/')
    const cartLink = page.locator('header a[href="/cart"]')
    await expect(cartLink).toHaveAttribute('aria-label', 'Carrinho, 2 itens')

    await page.getByRole('button', { name: /Menu da conta de Ana Lima/ }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page.locator('header').getByRole('button', { name: 'Entrar' })).toBeVisible()
    await expect(cartLink).toHaveAttribute('aria-label', 'Carrinho')

    await page.locator('header').getByRole('button', { name: 'Entrar' }).click()
    await app.submitLogin(USERS.bruno.email)
    await expect(page.getByRole('button', { name: /Menu da conta de Bruno Costa/ })).toBeVisible()
    await expect(cartLink).toHaveAttribute('aria-label', 'Carrinho')
    await app.open('/account')
    await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(USERS.bruno.email)
  })
})
