import type { PapelUsuario } from './types'

export interface Membro {
  uid: string
  papel: PapelUsuario
}

/**
 * Contrato de acesso ao cadastro de membros de uma Loja (papel de acesso
 * ao sistema — não confundir com o quadro social da Loja em si).
 *
 * Assim como InventoryRepository, a implementação web usa o Firebase JS
 * SDK; uma futura implementação mobile usará @react-native-firebase.
 */
export interface MembroRepository {
  getMembro(lojaId: string, uid: string): Promise<Membro | null>
}
