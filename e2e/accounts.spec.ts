import { expect, test } from '@playwright/test'

test('gerencia contas sem antecipar campos financeiros', async ({ page }) => {
  await page.goto('/contas?e2e-authenticated&e2e-email-verified')
  await expect(page.getByRole('heading', { name: 'Contas' })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar conta' }).click()
  await page.getByLabel('Nome').fill('Conta principal')
  await page.getByLabel('Instituição (opcional)').fill('Banco')
  await page.getByRole('button', { name: 'Salvar conta' }).click()
  await expect(page.getByText('Conta criada com sucesso.')).toBeVisible()
  await expect(page.getByText('Conta principal')).toBeVisible()
  await expect(page.getByText(/saldo|patrimônio|limite|fatura/i)).toHaveCount(0)
})
