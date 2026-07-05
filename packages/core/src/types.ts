export type PapelUsuario = 'admin' | 'editor' | 'leitor'

/** Contadores de papéis ativos por Loja, mantidos pelo client (em transação)
 * para garantir o piso de administradores (backstop nas regras). */
export interface RoleCounts {
  admin: number
  editor: number
}

export type AcaoAuditoria = 'create' | 'update-role' | 'disable' | 'enable'

export interface RegistroAuditoria {
  id: string
  targetUid: string
  changedBy: string
  previousRole: PapelUsuario | null
  newRole: PapelUsuario | null
  action: AcaoAuditoria
  timestamp: Date
}

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

declare const cursorItensBrand: unique symbol

/**
 * Cursor opaco de paginação. Cada plataforma guarda por baixo o seu próprio
 * tipo de "ponteiro" para o último documento da página (no web é um
 * `QueryDocumentSnapshot` do Firebase JS SDK; no mobile será o equivalente
 * do @react-native-firebase). O consumidor NUNCA inspeciona este valor —
 * apenas o repassa para buscar a próxima página. Manter opaco é o que
 * permite a interface de repositório continuar independente de plataforma.
 */
export type CursorItens = { readonly [cursorItensBrand]: true }

export interface ParametrosPaginaItens {
  /** Quantos itens a página deve conter. */
  pageSize: number
  /**
   * Cursor da página anterior. `null`/ausente busca a primeira página.
   * Deve ser exatamente o `cursor` devolvido em `PaginaItens`.
   */
  cursor?: CursorItens | null
}

export interface PaginaItens {
  itens: ItemInventario[]
  /** Cursor para a próxima página; `null` quando não há próxima página. */
  cursor: CursorItens | null
  /**
   * `true` quando existe pelo menos mais uma página. Derivado buscando
   * `pageSize + 1` documentos — sem custo de um `count()` adicional.
   */
  hasMore: boolean
}
