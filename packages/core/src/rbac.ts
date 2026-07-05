import type { PapelUsuario, RoleCounts } from './types'

/**
 * Lógica pura de decisão do RBAC — sem IO, sem Firebase. Concentra as regras
 * de contadores e os invariantes de negócio, testável isoladamente. No modelo
 * doc-based (sem Cloud Functions), é usada no client para validar antes de
 * escrever; as regras do Firestore garantem o piso de admin como backstop.
 */

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string }

// Sempre ≥1 admin ativo por Loja (crítico, também garantido nas regras).
// ≥1 editor é guarda client-side (as regras não o enforçam, para não travar
// Lojas que hoje não têm nenhum editor).
export const MIN_ADMIN = 1
export const MIN_EDITOR = 1

export function ehPapelContado(papel: PapelUsuario): papel is 'admin' | 'editor' {
  return papel === 'admin' || papel === 'editor'
}

function validarMinimos(counts: RoleCounts): Resultado<RoleCounts> {
  if (counts.admin < MIN_ADMIN) {
    return { ok: false, erro: 'Não é possível remover o último administrador ativo da Loja.' }
  }
  if (counts.editor < MIN_EDITOR) {
    return { ok: false, erro: 'Não é possível remover o último editor ativo da Loja.' }
  }
  return { ok: true, valor: counts }
}

/** Criar sempre é seguro (adicionar nunca viola mínimos). */
export function planejarCriar(papel: PapelUsuario, counts: RoleCounts): RoleCounts {
  const novo = { ...counts }
  if (ehPapelContado(papel)) novo[papel] += 1
  return novo
}

/**
 * Troca de papel. Membro desativado não conta, então a troca não altera
 * contadores. Recalcular e validar cobre o "não pode remover o último
 * admin/editor" (inclusive auto-rebaixamento).
 */
export function planejarTrocaPapel(args: {
  previousRole: PapelUsuario
  newRole: PapelUsuario
  ativo: boolean
  counts: RoleCounts
}): Resultado<RoleCounts> {
  const { previousRole, newRole, ativo, counts } = args
  if (!ativo || previousRole === newRole) return { ok: true, valor: { ...counts } }
  const novo = { ...counts }
  if (ehPapelContado(previousRole)) novo[previousRole] -= 1
  if (ehPapelContado(newRole)) novo[newRole] += 1
  return validarMinimos(novo)
}

/** Desativar remove dos contadores; precisa preservar os mínimos. */
export function planejarDesativar(papel: PapelUsuario, counts: RoleCounts): Resultado<RoleCounts> {
  const novo = { ...counts }
  if (ehPapelContado(papel)) novo[papel] -= 1
  return validarMinimos(novo)
}

/** Reativar readiciona aos contadores; nunca viola mínimo. */
export function planejarReativar(papel: PapelUsuario, counts: RoleCounts): RoleCounts {
  const novo = { ...counts }
  if (ehPapelContado(papel)) novo[papel] += 1
  return novo
}
