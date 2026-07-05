import type { Categoria, PapelUsuario, StatusItem } from './types'

export const ROLE_LABELS: Record<PapelUsuario, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  leitor: 'Leitor',
}

export const CATEGORIA_LABELS: Record<Categoria, string> = {
  acessibilidade_saude: 'Acessibilidade / Saúde',
  mobiliario: 'Mobiliário',
  cozinha: 'Cozinha',
  comemorativo: 'Comemorativo',
  ritualistico: 'Ritualístico',
  eletronicos: 'Eletrônicos',
  outros: 'Outros',
}

export const STATUS_LABELS: Record<StatusItem, string> = {
  ativo: 'Ativo',
  baixado: 'Baixado',
  emprestado: 'Emprestado',
  manutencao: 'Em manutenção',
}
