import { describe, expect, it } from 'vitest'
import type { RoleCounts } from '../src/types'
import {
  planejarCriar,
  planejarDesativar,
  planejarReativar,
  planejarTrocaPapel,
} from '../src/rbac'

const base = (admin: number, editor: number): RoleCounts => ({ admin, editor })

describe('planejarCriar', () => {
  it('incrementa admin/editor, ignora leitor', () => {
    expect(planejarCriar('admin', base(1, 1))).toEqual(base(2, 1))
    expect(planejarCriar('editor', base(1, 1))).toEqual(base(1, 2))
    expect(planejarCriar('leitor', base(1, 1))).toEqual(base(1, 1))
  })
})

describe('planejarTrocaPapel', () => {
  it('promove leitor -> editor', () => {
    expect(planejarTrocaPapel({ previousRole: 'leitor', newRole: 'editor', ativo: true, counts: base(1, 1) })).toEqual({
      ok: true,
      valor: base(1, 2),
    })
  })

  it('rebaixa admin -> editor quando há outro admin', () => {
    expect(planejarTrocaPapel({ previousRole: 'admin', newRole: 'editor', ativo: true, counts: base(2, 1) })).toEqual({
      ok: true,
      valor: base(1, 2),
    })
  })

  it('BLOQUEIA rebaixar o último admin', () => {
    expect(planejarTrocaPapel({ previousRole: 'admin', newRole: 'leitor', ativo: true, counts: base(1, 1) }).ok).toBe(false)
  })

  it('BLOQUEIA rebaixar o último editor (inclui auto-rebaixamento)', () => {
    expect(planejarTrocaPapel({ previousRole: 'editor', newRole: 'leitor', ativo: true, counts: base(1, 1) }).ok).toBe(false)
  })

  it('membro desativado não altera contadores', () => {
    expect(planejarTrocaPapel({ previousRole: 'admin', newRole: 'leitor', ativo: false, counts: base(1, 1) })).toEqual({
      ok: true,
      valor: base(1, 1),
    })
  })

  it('mesmo papel é no-op', () => {
    expect(planejarTrocaPapel({ previousRole: 'editor', newRole: 'editor', ativo: true, counts: base(1, 1) })).toEqual({
      ok: true,
      valor: base(1, 1),
    })
  })
})

describe('planejarDesativar', () => {
  it('BLOQUEIA desativar o último admin', () => {
    expect(planejarDesativar('admin', base(1, 1)).ok).toBe(false)
  })
  it('permite desativar admin quando há outro', () => {
    expect(planejarDesativar('admin', base(2, 1))).toEqual({ ok: true, valor: base(1, 1) })
  })
  it('desativar leitor não mexe nos contadores', () => {
    expect(planejarDesativar('leitor', base(1, 1))).toEqual({ ok: true, valor: base(1, 1) })
  })
})

describe('planejarReativar', () => {
  it('readiciona admin/editor aos contadores', () => {
    expect(planejarReativar('admin', base(1, 1))).toEqual(base(2, 1))
    expect(planejarReativar('leitor', base(1, 1))).toEqual(base(1, 1))
  })
})
