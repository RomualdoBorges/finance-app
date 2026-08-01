import { expect, test } from '@playwright/test'

test('lista defaults e cria categoria e subcategoria no grupo ativo', async ({
  page,
}) => {
  await page.goto('/categorias?e2e-authenticated&e2e-email-verified')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Categorias' }),
  ).toBeVisible()
  await expect(page.getByText('Moradia', { exact: true })).toBeVisible()
  await expect(page.getByText('Salário', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar categoria' }).click()
  await page.getByLabel('Nome').fill('Pets')
  await page.getByRole('button', { name: 'Salvar categoria' }).click()
  await expect(page.getByText('Pets', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar categoria' }).click()
  await page.getByLabel('Nome').fill('Veterinário')
  await page
    .getByLabel('Categoria principal (opcional)')
    .selectOption({ label: 'Pets (despesa)' })
  await expect(page.getByLabel('Tipo')).toBeDisabled()
  await page.getByRole('button', { name: 'Salvar categoria' }).click()
  await expect(page.getByText('Veterinário', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Início' }).click()
  await page.getByRole('link', { name: 'Categorias' }).click()
  await expect(page.getByText('Pets', { exact: true })).toBeVisible()
  await expect(page.getByText('Veterinário', { exact: true })).toBeVisible()
})
