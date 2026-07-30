import { expect, test } from '@playwright/test'

test('garante e reutiliza o perfil no acesso autenticado', async ({ page }) => {
  await page.goto('/?e2e-authenticated&e2e-email-verified')

  await expect(page.getByTestId('user-profile-status')).toHaveText(
    'Dados da conta carregados',
  )
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Fundação da aplicação configurada',
    }),
  ).toBeVisible()

  await page.reload()
  await expect(page.getByTestId('user-profile-status')).toHaveText(
    'Dados da conta carregados',
  )
})

test('mantém autenticação e conteúdo durante erro e retry do perfil', async ({
  page,
}) => {
  await page.goto(
    '/?e2e-authenticated&e2e-email-verified&e2e-profile-error',
  )

  await expect(page.getByTestId('user-profile-status')).toContainText(
    'Não foi possível carregar os dados da conta.',
  )
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Fundação da aplicação configurada',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Sair da conta' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByTestId('user-profile-status')).toHaveText(
    'Dados da conta carregados',
  )
})
