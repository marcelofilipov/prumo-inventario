import type {
  CursorItens,
  FiltroItens,
  InventoryRepository,
  ItemInventario,
  NovoItemInventario,
  PaginaItens,
  ParametrosPaginaItens,
} from '@prumo/core'
import { aplicarFiltroItens } from '@prumo/core'
import {
  type Firestore,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore'

function itensCollectionPath(lojaId: string) {
  return `lojas/${lojaId}/itens`
}

function toItemInventario(id: string, lojaId: string, data: Record<string, unknown>): ItemInventario {
  return {
    id,
    lojaId,
    descricao: data.descricao as string,
    quantidade: data.quantidade as number,
    codigoLegado: data.codigoLegado as string,
    categoria: data.categoria as ItemInventario['categoria'],
    localizacao: data.localizacao as string | undefined,
    observacao: data.observacao as string | undefined,
    dataAquisicao: data.dataAquisicao
      ? (data.dataAquisicao as Timestamp).toDate()
      : undefined,
    valorEstimado: data.valorEstimado as number | undefined,
    status: data.status as ItemInventario['status'],
    fotos: (data.fotos as string[]) ?? [],
    criadoPor: data.criadoPor as string,
    criadoEm: (data.criadoEm as Timestamp).toDate(),
    atualizadoPor: data.atualizadoPor as string,
    atualizadoEm: (data.atualizadoEm as Timestamp).toDate(),
  }
}

/**
 * Implementação de InventoryRepository para o app web, usando o Firebase
 * JS SDK. Uma implementação equivalente para o app mobile (React Native)
 * deverá usar @react-native-firebase, respeitando a mesma interface
 * definida em @prumo/core.
 */
export class FirestoreInventoryRepository implements InventoryRepository {
  private readonly db: Firestore

  constructor(db: Firestore) {
    this.db = db
  }

  async listItems(lojaId: string, filtro?: FiltroItens): Promise<ItemInventario[]> {
    const ref = collection(this.db, itensCollectionPath(lojaId))
    const constraints = []
    if (filtro?.codigoLegado) {
      constraints.push(where('codigoLegado', '==', filtro.codigoLegado))
    }
    const snapshot = await getDocs(
      constraints.length ? query(ref, ...constraints) : query(ref),
    )
    const itens = snapshot.docs.map((d) => toItemInventario(d.id, lojaId, d.data()))

    // Filtros de texto livre (descrição/observação) são aplicados em
    // memória por ora — considerar Algolia/Typesense se a base crescer.
    return aplicarFiltroItens(itens, filtro)
  }

  /**
   * Paginação por cursor: `orderBy(descricao)` + `startAfter(cursor)` +
   * `limit(pageSize + 1)`. Buscar um item a mais detecta `hasMore` sem um
   * `count()` extra. Passar o `QueryDocumentSnapshot` inteiro para
   * `startAfter` garante desempate estável por `__name__` mesmo quando há
   * descrições repetidas.
   *
   * Não aplica filtros no servidor — o refino é feito no cliente sobre as
   * páginas carregadas (ver `aplicarFiltroItens`). Por isso a query só
   * precisa do índice de campo único de `descricao` (automático); nenhum
   * índice composto é necessário nesta versão.
   */
  async listItemsPage(
    lojaId: string,
    params: ParametrosPaginaItens,
  ): Promise<PaginaItens> {
    const { pageSize, cursor } = params
    const ref = collection(this.db, itensCollectionPath(lojaId))

    const constraints: QueryConstraint[] = [orderBy('descricao')]
    if (cursor) {
      constraints.push(startAfter(cursor as unknown as QueryDocumentSnapshot))
    }
    constraints.push(limit(pageSize + 1))

    const snapshot = await getDocs(query(ref, ...constraints))
    const docs = snapshot.docs
    const hasMore = docs.length > pageSize
    // slice sobre os pageSize+1 docs JÁ paginados por cursor — não sobre a
    // coleção inteira. É a técnica de detecção de próxima página, não offset.
    const visiveis = hasMore ? docs.slice(0, pageSize) : docs

    const itens = visiveis.map((d) => toItemInventario(d.id, lojaId, d.data()))
    const ultimo = visiveis[visiveis.length - 1]
    const proximoCursor =
      hasMore && ultimo ? (ultimo as unknown as CursorItens) : null

    return { itens, cursor: proximoCursor, hasMore }
  }

  async getItem(lojaId: string, itemId: string): Promise<ItemInventario | null> {
    const ref = doc(this.db, itensCollectionPath(lojaId), itemId)
    const snapshot = await getDoc(ref)
    if (!snapshot.exists()) return null
    return toItemInventario(snapshot.id, lojaId, snapshot.data())
  }

  async createItem(item: NovoItemInventario): Promise<ItemInventario> {
    const ref = collection(this.db, itensCollectionPath(item.lojaId))
    const now = Timestamp.now()
    const docRef = await addDoc(ref, {
      ...item,
      dataAquisicao: item.dataAquisicao ? Timestamp.fromDate(item.dataAquisicao) : null,
      criadoEm: now,
      atualizadoEm: now,
    })
    return toItemInventario(docRef.id, item.lojaId, {
      ...item,
      criadoEm: now,
      atualizadoEm: now,
    })
  }

  async updateItem(
    lojaId: string,
    itemId: string,
    patch: Partial<NovoItemInventario>,
  ): Promise<void> {
    const ref = doc(this.db, itensCollectionPath(lojaId), itemId)
    await updateDoc(ref, {
      ...patch,
      dataAquisicao: patch.dataAquisicao ? Timestamp.fromDate(patch.dataAquisicao) : undefined,
      atualizadoEm: Timestamp.now(),
    })
  }

  async deleteItem(lojaId: string, itemId: string): Promise<void> {
    const ref = doc(this.db, itensCollectionPath(lojaId), itemId)
    await deleteDoc(ref)
  }
}
