import type { FiltroItens, ItemInventario, NovoItemInventario } from './types'

/**
 * Contrato de acesso a dados de inventário, independente de plataforma.
 *
 * A implementação web (packages/data) usa o Firebase JS SDK. Uma futura
 * implementação para o app mobile (React Native) deverá usar
 * @react-native-firebase — API diferente do Firebase JS SDK — mas deve
 * satisfazer esta mesma interface para que a lógica de negócio em
 * packages/core continue sendo compartilhada.
 */
export interface InventoryRepository {
  listItems(lojaId: string, filtro?: FiltroItens): Promise<ItemInventario[]>
  getItem(lojaId: string, itemId: string): Promise<ItemInventario | null>
  createItem(item: NovoItemInventario): Promise<ItemInventario>
  updateItem(
    lojaId: string,
    itemId: string,
    patch: Partial<NovoItemInventario>,
  ): Promise<void>
  deleteItem(lojaId: string, itemId: string): Promise<void>
}
