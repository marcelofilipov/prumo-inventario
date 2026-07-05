import type { NovoItemInventario } from '@prumo/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lojaId } from './firebase'
import { inventoryRepository } from './repositories'

/**
 * Toda mutação de item invalida a listagem pelo prefixo `['itens']`, forçando
 * revalidação contra o Firestore. Não há atualização otimista: a quantidade
 * em estoque é dado crítico e só reflete na UI após a confirmação da escrita.
 */
function useInvalidarItens() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['itens'] })
}

export function useCriarItem() {
  const invalidar = useInvalidarItens()
  return useMutation({
    mutationFn: (item: NovoItemInventario) => inventoryRepository.createItem(item),
    onSuccess: invalidar,
  })
}

export function useAtualizarItem() {
  const invalidar = useInvalidarItens()
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<NovoItemInventario> }) =>
      inventoryRepository.updateItem(lojaId, args.id, args.patch),
    onSuccess: invalidar,
  })
}

export function useExcluirItem() {
  const invalidar = useInvalidarItens()
  return useMutation({
    mutationFn: (itemId: string) => inventoryRepository.deleteItem(lojaId, itemId),
    onSuccess: invalidar,
  })
}
