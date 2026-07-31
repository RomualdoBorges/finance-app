import { expect, test } from '@playwright/test'

test('gerencia tipos e opções de consolidação sem calcular valores', async ({ page }) => {
  await page.goto('/contas?e2e-authenticated&e2e-email-verified')
  await expect(page.getByRole('heading', { name: 'Contas' })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar conta' }).click()
  await page.getByLabel('Nome').fill('Conta principal')
  await page.getByLabel('Instituição (opcional)').fill('Banco')
  await page.getByLabel('Tipo da conta').selectOption('credit_card')
  await expect(page.getByLabel(/Incluir no saldo/)).not.toBeChecked()
  await expect(page.getByLabel(/Incluir no patrimônio/)).toBeChecked()
  await page.getByRole('button', { name: 'Salvar conta' }).click()
  await expect(page.getByText('Conta criada com sucesso.')).toBeVisible()
  await expect(page.getByText('Conta principal')).toBeVisible()
  await expect(page.getByText('Cartão de crédito')).toBeVisible()
  await expect(page.getByText('Não inclui no saldo · Inclui no patrimônio')).toBeVisible()
  await expect(page.getByText(/R\$|saldo atual|saldo projetado|limite|fatura/i)).toHaveCount(0)
})
