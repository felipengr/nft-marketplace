import { readFileSync } from 'node:fs'
import path from 'node:path'
import { USERS, expect, test } from './support/fixtures'

const AVATAR = readFileSync(path.join(import.meta.dirname, 'support', 'avatar.png'))

test.describe('Perfil, avatar, senha e carteiras', () => {
  test.beforeEach(async ({ app }) => {
    await app.start()
    await app.signIn(USERS.ana.email)
  })

  test('edita dados do perfil com validação e erros da API', async ({ app, page }) => {
    await app.open('/account')
    const field = (name: string) => page.getByRole('textbox', { name, exact: true })
    await expect(field('Nome de exibição')).toHaveValue('Ana Lima')

    await field('E-mail').fill(USERS.bruno.email)
    await field('Nome de usuário').fill('bruno.costa')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Este e-mail já está em uso por outra conta.')).toBeVisible()
    await expect(page.getByText('Este nome de usuário já está em uso.')).toBeVisible()
    await expect(field('E-mail')).toHaveAttribute('aria-invalid', 'true')

    await field('E-mail').fill(USERS.ana.email)
    await field('Nome de usuário').fill('ana.lima')
    await field('Nome de exibição').fill('A')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Informe o nome de exibição.')).toBeVisible()

    await field('Nome de exibição').fill('Ana Lima Souza')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Perfil atualizado.')).toBeVisible()
    await page.reload()
    await expect(field('Nome de exibição')).toHaveValue('Ana Lima Souza')
  })

  test('altera e remove o avatar, recusando arquivos inválidos', async ({ app, page }) => {
    await app.open('/account')
    await page.locator('input[type=file]').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: AVATAR })
    await expect(page.getByText('Avatar atualizado.')).toBeVisible()
    await expect(page.getByRole('img', { name: /Avatar de/ })).toBeVisible()

    await page.locator('input[type=file]').setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') })
    await expect(page.getByText('Envie uma imagem PNG, JPG ou WEBP.')).toBeVisible()

    await page.getByRole('button', { name: 'Remover avatar' }).click()
    await expect(page.getByText('Avatar removido.')).toBeVisible()
    await expect(page.getByRole('img', { name: /Avatar de/ })).toHaveCount(0)
  })

  test('altera a senha validando a senha atual', async ({ app, page }) => {
    await app.open('/account')
    await page.getByLabel('Senha atual').fill('errada123')
    await page.getByLabel('Nova senha', { exact: true }).fill('novaSenha1')
    await page.getByLabel('Confirmar nova senha').fill('outraSenha1')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('As senhas não coincidem.')).toBeVisible()

    await page.getByLabel('Confirmar nova senha').fill('novaSenha1')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('A senha atual está incorreta.').first()).toBeVisible()

    await page.getByLabel('Senha atual').fill('Kurio@2026')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Perfil e senha atualizados.')).toBeVisible()
    const oldLogin = await app.api('POST', '/auth/login', { email: USERS.ana.email, password: 'Kurio@2026' })
    const newLogin = await app.api('POST', '/auth/login', { email: USERS.ana.email, password: 'novaSenha1' })
    expect(oldLogin.status).toBe(401)
    expect(newLogin.status).toBe(200)
    expect(await page.evaluate(() => localStorage.getItem('kurio.mock-db') ?? '')).not.toContain('novaSenha1')
  })

  test('cadastra e edita carteiras principal e secundária com validação', async ({ app, page }) => {
    await app.open('/account/wallets')
    const address = page.locator('#wallet-primary-address')
    await expect(address).toHaveValue(/^0xA91F/)

    await address.fill('0x12')
    await page.getByRole('button', { name: 'Salvar carteira' }).first().click()
    await expect(page.getByText('Informe um endereço 0x válido com 40 caracteres hexadecimais.')).toBeVisible()

    await address.fill('0x7F4d2C9a1B3e5D7f9A0b2C4d6E8f0A1b3C5d7E9F')
    await page.getByRole('button', { name: 'Salvar carteira' }).first().click()
    await expect(page.getByText('Este endereço já está vinculado a outra conta.').first()).toBeVisible()

    await address.fill('0x1111111111111111111111111111111111111111')
    await page.locator('#wallet-primary-label').fill('Cofre')
    await page.getByRole('button', { name: 'Salvar carteira' }).first().click()
    await expect(page.getByText('Carteira principal salva.')).toBeVisible()

    await page.getByRole('button', { name: 'Remover carteira secundária' }).click()
    await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
    await page.getByLabel('Igual à carteira principal').check()
    await page.getByRole('button', { name: 'Adicionar' }).click()
    await expect(page.locator('#wallet-secondary-address')).toHaveValue('0x1111111111111111111111111111111111111111')
    await page.getByRole('button', { name: 'Salvar carteira' }).nth(1).click()
    await expect(page.getByText('Carteira secundária salva.')).toBeVisible()

    await page.reload()
    await expect(page.locator('#wallet-primary-label')).toHaveValue('Cofre')
    await app.addToCart('golden-beat-207', 1)
    await app.open('/checkout')
    await expect(page.getByText('Cofre')).toBeVisible()
  })
})
