import { expect, test } from '@playwright/test'

test('navega entre login e cadastro', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('link', { name: 'Cadastre-se' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Crie sua conta' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/cadastro$/)

  await page.getByRole('link', { name: 'Entrar' }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Entre na sua conta' }),
  ).toBeVisible()
})

test('valida os campos básicos sem acessar o Firebase', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByText('Informe seu e-mail.')).toBeVisible()
  await expect(page.getByText('Informe sua senha.')).toBeVisible()
  await expect(page.getByLabel('E-mail')).toBeFocused()
})
