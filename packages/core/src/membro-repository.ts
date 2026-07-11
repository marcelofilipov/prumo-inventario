import type { PapelUsuario } from './types'

export interface Membro {
  uid: string
  email: string
  displayName: string
  papel: PapelUsuario
  disabled: boolean
  criadoEm?: Date
  atualizadoEm?: Date
}

/**
 * Contrato de acesso ao cadastro de membros de uma Loja (papel de acesso
 * ao sistema — não confundir com o quadro social da Loja em si).
 *
 * Assim como InventoryRepository, a implementação web usa o Firebase JS
 * SDK; uma futura implementação mobile usará @react-native-firebase.
 *
 * Só há leitura aqui: qualquer escrita em membros/papel passa pelas Cloud
 * Functions callable (Admin SDK), nunca direto pelo client.
 */
export interface MembroRepository {
  getMembro(lojaId: string, uid: string): Promise<Membro | null>
  listMembros(lojaId: string): Promise<Membro[]>
}
