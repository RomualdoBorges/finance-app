import { describe, expect, it } from 'vitest'

import {
  createInternalDestination,
  readAuthRedirectState,
  resolvePostAuthenticationDestination,
} from './authRedirect'
import { routePaths } from './paths'

describe('redirecionamento de autenticação', () => {
  it('preserva pathname, query e hash de uma localização interna', () => {
    expect(
      createInternalDestination({
        pathname: '/conta/alterar-senha',
        search: '?origem=configuracoes',
        hash: '#seguranca',
      }),
    ).toEqual({
      pathname: '/conta/alterar-senha',
      search: '?origem=configuracoes',
      hash: '#seguranca',
    })
  })

  it('aceita somente um destino interno bem formado', () => {
    const state = {
      from: {
        pathname: '/conta/excluir',
        search: '?origem=conta',
        hash: '#confirmacao',
      },
    }
    expect(readAuthRedirectState(state)).toEqual(state)
    expect(resolvePostAuthenticationDestination(state)).toEqual(state.from)
  })

  it.each([
    undefined,
    null,
    {},
    { from: '/conta/excluir' },
    { from: { pathname: 'https://malicioso.example', search: '', hash: '' } },
    { from: { pathname: '//malicioso.example', search: '', hash: '' } },
    { from: { pathname: 'javascript:alert(1)', search: '', hash: '' } },
    { from: { pathname: 'data:text/html,oi', search: '', hash: '' } },
    { from: { pathname: '/segura', search: 'query', hash: '' } },
    { from: { pathname: '/segura', search: '', hash: 'fragmento' } },
  ])('rejeita estado ausente, externo ou malformado: %o', (state) => {
    expect(readAuthRedirectState(state)).toEqual({})
    expect(resolvePostAuthenticationDestination(state)).toBe(
      routePaths.authenticatedHome,
    )
  })
})
