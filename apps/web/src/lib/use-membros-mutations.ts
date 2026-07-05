import type { PapelUsuario } from '@prumo/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  atualizarPapelMembro,
  criarMembro,
  desativarMembro,
  reativarMembro,
} from './membros-admin'

/**
 * Após cada mutação de membro, invalida a listagem para refletir o novo
 * estado (papel/disabled) vindo do Firestore. As functions já atualizaram
 * doc + claim + contadores de forma transacional.
 */
function useInvalidarMembros() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['membros'] })
}

export function useCriarMembro() {
  const invalidar = useInvalidarMembros()
  return useMutation({
    mutationFn: (input: { email: string; displayName?: string; papel: PapelUsuario }) =>
      criarMembro(input),
    onSuccess: invalidar,
  })
}

export function useAtualizarPapel() {
  const invalidar = useInvalidarMembros()
  return useMutation({
    mutationFn: (input: { uid: string; novoPapel: PapelUsuario }) => atualizarPapelMembro(input),
    onSuccess: invalidar,
  })
}

export function useDesativarMembro() {
  const invalidar = useInvalidarMembros()
  return useMutation({
    mutationFn: (uid: string) => desativarMembro(uid),
    onSuccess: invalidar,
  })
}

export function useReativarMembro() {
  const invalidar = useInvalidarMembros()
  return useMutation({
    mutationFn: (uid: string) => reativarMembro(uid),
    onSuccess: invalidar,
  })
}
