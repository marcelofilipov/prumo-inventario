import type { PapelUsuario } from './types'

/**
 * Espelha a função `podeEditar` de firestore.rules — mantenha as duas em
 * sincronia. Esta versão só controla o que a UI mostra; a segurança de
 * fato é sempre garantida pelas regras do Firestore.
 */
export function podeGerenciarItens(papel: PapelUsuario | null): boolean {
  return papel === 'admin' || papel === 'editor'
}

/**
 * Só administradores gerenciam usuários/papéis. Espelha as regras de acesso a
 * `membros`; a UI usa isto apenas para mostrar/esconder a tela de
 * administração — a segurança real está nas regras do Firestore.
 */
export function podeGerenciarUsuarios(papel: PapelUsuario | null): boolean {
  return papel === 'admin'
}
