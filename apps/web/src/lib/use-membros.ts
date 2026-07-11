import { useQuery } from '@tanstack/react-query'
import { lojaId } from './firebase'
import { membroRepository } from './repositories'

export const MEMBROS_QUERY_KEY = ['membros', lojaId] as const

/**
 * Lista os membros da Loja para a tela de administração. Lê o espelho no
 * Firestore (rápido para listagem); as ações de escrita chamam as callables.
 */
export function useMembros(habilitado: boolean) {
  return useQuery({
    queryKey: MEMBROS_QUERY_KEY,
    queryFn: () => membroRepository.listMembros(lojaId),
    enabled: habilitado,
    staleTime: 30_000,
  })
}
