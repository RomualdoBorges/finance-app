import { expect, test } from '@playwright/test'

test('carrega a página inicial', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('banner')).toContainText('Financeiro')
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Fundação da aplicação configurada',
    }),
  ).toBeVisible()
})

test('permite navegar e selecionar o tema em tela pequena', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 720 })
  await page.goto('/')

  await page.getByRole('button', { name: 'Abrir navegação' }).click()
  await expect(
    page.getByRole('dialog', { name: 'Financeiro' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Fechar navegação' }).click()

  await page.getByRole('button', { name: /Selecionar tema/ }).click()
  await page.getByRole('menuitemradio', { name: 'Escuro' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
