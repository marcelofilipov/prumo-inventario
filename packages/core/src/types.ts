export type PapelUsuario = 'admin' | 'editor' | 'leitor'

export type StatusItem = 'ativo' | 'baixado' | 'emprestado' | 'manutencao'

/**
 * Categoria derivada do prefixo do código legado do sistema ASP.NET
 * (ex.: 4002 -> "mobiliario"). O mapeamento completo prefixo -> categoria
 * precisa ser confirmado com o cliente antes da migração final dos 579
 * itens — ver seção 4.1 do PROMPT.md.
 */
export type Categoria =
  | 'acessibilidade_saude'
  | 'mobiliario'
  | 'cozinha'
  | 'comemorativo'
  | 'ritualistico'
  | 'eletronicos'
  | 'outros'

export interface ItemInventario {
  id: string
  lojaId: string
  descricao: string
  quantidade: number
  codigoLegado: string
  categoria: Categoria
  localizacao?: string
  observacao?: string
  dataAquisicao?: Date
  valorEstimado?: number
  status: StatusItem
  fotos: string[]
  criadoPor: string
  criadoEm: Date
  atualizadoPor: string
  atualizadoEm: Date
}

export type NovoItemInventario = Omit<
  ItemInventario,
  'id' | 'criadoEm' | 'atualizadoEm'
>

export interface EventoHistoricoItem {
  id: string
  acao: 'criacao' | 'edicao' | 'exclusao'
  campo?: string
  valorAnterior?: unknown
  valorNovo?: unknown
  usuario: string
  timestamp: Date
}

export interface FiltroItens {
  descricao?: string
  codigoLegado?: string
  observacao?: string
  adquiridoDe?: Date
  adquiridoAte?: Date
}
