import { expect, test } from '@playwright/test'

test('cadastra receita e despesa sem alterar saldo da conta', async ({
  page,
}) => {
  await page.goto('/contas?e2e-authenticated&e2e-email-verified')
  await page.getByRole('button', { name: 'Adicionar conta' }).click()
  await page.getByLabel('Nome').fill('Conta dos lançamentos')
  await page.getByRole('button', { name: 'Salvar conta' }).click()
  const balanceBefore = await page
    .getByText(/Saldo inicial:/)
    .first()
    .textContent()
  await page.getByRole('link', { name: 'Lançamentos' }).click()
  await page.getByRole('button', { name: 'Novo lançamento' }).click()
  await page.getByLabel('Tipo').selectOption('income')
  await page.getByLabel('Descrição').fill('Receita E2E')
  await page.getByLabel('Valor').fill('1000,00')
  await page.locator('select[name="accountId"]').selectOption({ index: 1 })
  await page.locator('select[name="categoryId"]').selectOption({ index: 1 })
  await page.getByRole('button', { name: 'Salvar lançamento' }).click()
  await expect(page.getByText('Receita E2E')).toBeVisible()
  await expect(page.getByText(/Receita · R\$\s*1\.000,00/)).toBeVisible()

  await page.getByRole('button', { name: 'Novo lançamento' }).click()
  await page.getByLabel('Descrição').fill('Despesa E2E')
  await page.getByLabel('Valor').fill('150,50')
  await page.locator('select[name="accountId"]').selectOption({ index: 1 })
  await page.locator('select[name="categoryId"]').selectOption({ index: 1 })
  await page.getByRole('button', { name: 'Salvar lançamento' }).click()
  await expect(page.getByText('Despesa E2E')).toBeVisible()
  await page.goto('/lancamentos?e2e-authenticated&e2e-email-verified')
  await expect(page.getByText('Receita E2E')).toBeVisible()
  await expect(page.getByText('Despesa E2E')).toBeVisible()
  await expect(
    page.getByText(/Data de competência|Status|Vencimento/),
  ).toHaveCount(0)
  await page.getByRole('link', { name: 'Contas' }).click()
  await expect(page.getByText(balanceBefore ?? '')).toBeVisible()
})
