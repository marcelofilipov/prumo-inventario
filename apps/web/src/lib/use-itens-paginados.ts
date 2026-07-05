import type { PaginaItens } from '@prumo/core'
import { useInfiniteQuery } from '@tanstack/react-query'
import { lojaId } from './firebase'
import { inventoryRepository } from './repositories'

/** Itens por página buscados do Firestore (não é o total exibido — o refino
 * client-side pode reduzir esse número na tela). */
const PAGE_SIZE = 25

/**
 * Chave de cache da listagem. Propositalmente NÃO inclui os filtros: como o
 * refino é feito no cliente sobre as páginas carregadas, os dados buscados
 * são idênticos para qualquer filtro — incluir o filtro na chave só forçaria
 * refetches redundantes e quebraria o cache. As mutações invalidam pelo
 * prefixo `['itens']`.
 */
export const ITENS_QUERY_KEY = ['itens', lojaId] as const

export function useItensPaginados() {
  return useInfiniteQuery({
    queryKey: ITENS_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      inventoryRepository.listItemsPage(lojaId, {
        pageSize: PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: null as PaginaItens['cursor'],
    // Avança apenas se houver próxima página — senão o "carregar mais" para.
    getNextPageParam: (ultimaPagina) =>
      ultimaPagina.hasMore ? ultimaPagina.cursor : undefined,
    // Dado operacional: 10s. Ver nota de trade-off em docs/paginacao-itens.md.
    staleTime: 10_000,
  })
}
