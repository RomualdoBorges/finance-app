import { expect, test } from '@playwright/test'

test('redireciona acesso não autenticado para o login', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Entre na sua conta',
    }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('permite selecionar o tema em tela pequena', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 720 })
  await page.goto('/login')

  await page.getByRole('button', { name: /Selecionar tema/ }).click()
  await page.getByRole('menuitemradio', { name: 'Escuro' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
