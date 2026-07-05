import type {
  FiltroItens,
  ItemInventario,
  NovoItemInventario,
  PaginaItens,
  ParametrosPaginaItens,
} from './types'

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
  /**
   * Paginação por cursor da listagem de itens, ordenada por `descricao`.
   * Não aplica filtros no servidor: o refino (descrição/observação por
   * substring, código, faixa de data) é feito no cliente via
   * {@link aplicarFiltroItens} sobre as páginas já carregadas — decisão
   * consciente porque o Firestore não faz busca por substring. Isolar a
   * paginação aqui deixa aberta a evolução futura (ex.: onSnapshot só nos
   * itens da página visível) sem tocar na UI.
   */
  listItemsPage(
    lojaId: string,
    params: ParametrosPaginaItens,
  ): Promise<PaginaItens>
  getItem(lojaId: string, itemId: string): Promise<ItemInventario | null>
  createItem(item: NovoItemInventario): Promise<ItemInventario>
  updateItem(
    lojaId: string,
    itemId: string,
    patch: Partial<NovoItemInventario>,
  ): Promise<void>
  deleteItem(lojaId: string, itemId: string): Promise<void>
}
