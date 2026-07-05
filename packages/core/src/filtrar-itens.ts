import type { FiltroItens, ItemInventario } from './types'

/**
 * Refino de itens no cliente, independente de plataforma. É o mesmo conjunto
 * de regras usado tanto pela busca completa (`listItems`) quanto pelo refino
 * sobre as páginas já carregadas na paginação por cursor — o Firestore não
 * faz busca por substring, então descrição/observação são filtradas aqui.
 *
 * Reaproveitável no app mobile futuro por não depender de React nem do SDK.
 */
export function aplicarFiltroItens(
  itens: ItemInventario[],
  filtro?: FiltroItens,
): ItemInventario[] {
  if (!filtro) return itens

  return itens.filter((item) => {
    if (filtro.codigoLegado && item.codigoLegado !== filtro.codigoLegado) {
      return false
    }
    if (
      filtro.descricao &&
      !item.descricao.toLowerCase().includes(filtro.descricao.toLowerCase())
    ) {
      return false
    }
    if (
      filtro.observacao &&
      !item.observacao?.toLowerCase().includes(filtro.observacao.toLowerCase())
    ) {
      return false
    }
    if (
      filtro.adquiridoDe &&
      (!item.dataAquisicao || item.dataAquisicao < filtro.adquiridoDe)
    ) {
      return false
    }
    if (
      filtro.adquiridoAte &&
      (!item.dataAquisicao || item.dataAquisicao > filtro.adquiridoAte)
    ) {
      return false
    }
    return true
  })
}
