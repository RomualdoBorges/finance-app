import { expect, test } from '@playwright/test'

test('carrega a página inicial', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Fundação da aplicação configurada',
    }),
  ).toBeVisible()
})
