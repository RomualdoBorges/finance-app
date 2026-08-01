import { expect, test } from '@playwright/test'

test('navega entre login e cadastro', async ({ page }) => {
  await page.goto('/entrar')
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
  await page.goto('/entrar')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page.getByText('Informe seu e-mail.')).toBeVisible()
  await expect(page.getByText('Informe sua senha.')).toBeVisible()
  await expect(page.getByLabel('E-mail')).toBeFocused()
})

test('solicita recuperação de senha sem revelar a existência da conta', async ({
  page,
}) => {
  await page.goto('/entrar')
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Recuperar senha' }),
  ).toBeVisible()
  await page.getByLabel('E-mail').fill('pessoa@example.com')
  await page.getByRole('button', { name: 'Enviar instruções' }).click()

  await expect(page.getByRole('status')).toContainText(
    'Se existir uma conta para este e-mail',
  )
  await expect(
    page.getByRole('link', { name: 'Voltar ao login' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/recuperar-senha$/)
})

test('encerra a sessão e remove o conteúdo protegido', async ({ page }) => {
  await page.goto('/?e2e-authenticated&e2e-email-verified')

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Fundação da aplicação configurada',
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Sair da conta' }).click()

  await expect(page).toHaveURL(/\/entrar$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Entre na sua conta' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Fundação da aplicação configurada',
    }),
  ).not.toBeVisible()
})

test('reenvia e atualiza manualmente a verificação de e-mail', async ({
  page,
}) => {
  await page.goto('/verificar-email?e2e-authenticated')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Verifique seu e-mail' }),
  ).toBeVisible()
  await expect(page.getByText('pessoa@example.com')).toBeVisible()

  await page
    .getByRole('button', { name: 'Enviar e-mail de verificação' })
    .click()
  await expect(page.getByRole('status')).toContainText(
    'E-mail de verificação enviado.',
  )
  await expect(
    page.getByRole('button', { name: 'Reenviar em 60s' }),
  ).toBeDisabled()

  await page.getByRole('button', { name: 'Já verifiquei meu e-mail' }).click()
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Fundação da aplicação configurada',
    }),
  ).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
})

test('valida, trata senha atual incorreta e atualiza a senha sem sair', async ({
  page,
}) => {
  await page.goto('/?e2e-authenticated&e2e-email-verified')
  await page.getByRole('link', { name: 'Alterar senha' }).click()

  await expect(page).toHaveURL(/\/conta\/alterar-senha$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Alterar senha' }),
  ).toBeVisible()

  await page.getByLabel('Senha atual').fill('senha-atual-valida')
  await page.getByLabel('Nova senha', { exact: true }).fill('nova-senha')
  await page.getByLabel('Confirmar nova senha').fill('confirmacao-diferente')
  await page.getByRole('button', { name: 'Atualizar senha' }).click()
  await expect(
    page.getByText('A confirmação da senha não corresponde à nova senha.'),
  ).toBeVisible()
  await expect(page.getByRole('status')).not.toBeVisible()

  await page.getByLabel('Senha atual').fill('senha-atual-incorreta')
  await page.getByLabel('Confirmar nova senha').fill('nova-senha')
  await page.getByRole('button', { name: 'Atualizar senha' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'A senha atual está incorreta.',
  )
  await expect(page).toHaveURL(/\/conta\/alterar-senha$/)

  await page.getByLabel('Senha atual').fill('senha-atual-valida')
  await page.getByRole('button', { name: 'Atualizar senha' }).click()
  await expect(page.getByRole('status')).toContainText(
    'Senha atualizada com sucesso.',
  )
  await expect(page.getByLabel('Senha atual')).toHaveValue('')
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Confirmar nova senha')).toHaveValue('')
  await expect(page).toHaveURL(/\/conta\/alterar-senha$/)
  await expect(
    page.getByRole('button', { name: 'Sair da conta' }),
  ).toBeVisible()
})

test('protege a atualização de senha por sessão e verificação', async ({
  page,
}) => {
  await page.goto('/conta/alterar-senha')
  await expect(page).toHaveURL(/\/entrar$/)

  await page.goto('/conta/alterar-senha?e2e-authenticated')
  await expect(page).toHaveURL(/\/verificar-email$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Verifique seu e-mail' }),
  ).toBeVisible()
})

test('valida, exclui e redireciona após encerrar a sessão', async ({
  page,
}) => {
  await page.goto('/conta/excluir?e2e-authenticated&e2e-email-verified')

  await page.getByRole('button', { name: 'Excluir conta' }).click()
  await expect(page.getByText('Informe sua senha atual.')).toBeVisible()
  await expect(
    page.getByText('Confirme que você entende que esta ação é permanente.'),
  ).toBeVisible()

  await page.getByLabel('Senha atual').fill('senha-atual-incorreta')
  await page.getByLabel('Entendo que esta ação é permanente.').check()
  await page.getByRole('button', { name: 'Excluir conta' }).click()
  await expect(page.getByRole('alert')).toContainText(
    'A senha atual está incorreta.',
  )
  await expect(page).toHaveURL(/\/conta\/excluir/)

  await page.getByLabel('Senha atual').fill('senha-atual-valida')
  await page.getByRole('button', { name: 'Excluir conta' }).click()
  await expect(page).toHaveURL(/\/entrar$/)
})

test('protege a exclusão por sessão e verificação', async ({ page }) => {
  await page.goto('/conta/excluir')
  await expect(page).toHaveURL(/\/entrar$/)

  await page.goto('/conta/excluir?e2e-authenticated')
  await expect(page).toHaveURL(/\/verificar-email$/)
})

test('restaura o destino completo após autenticação e verificação', async ({
  page,
}) => {
  await page.goto(
    '/conta/alterar-senha?origem=configuracoes&e2e-authenticated#seguranca',
  )
  await expect(page).toHaveURL(/\/verificar-email/)

  await page.getByRole('button', { name: 'Já verifiquei meu e-mail' }).click()
  await expect(page).toHaveURL(
    /\/conta\/alterar-senha\?origem=configuracoes&e2e-authenticated#seguranca$/,
  )
})

test('impede usuário verificado de acessar páginas públicas de autenticação', async ({
  page,
}) => {
  for (const path of ['/entrar', '/cadastro', '/recuperar-senha']) {
    await page.goto(`${path}?e2e-authenticated&e2e-email-verified`)
    await expect(page).toHaveURL(/\/$/)
  }
})
