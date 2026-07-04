import type {
  FiltroItens,
  InventoryRepository,
  ItemInventario,
  NovoItemInventario,
} from '@prumo/core'
import {
  type Firestore,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
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
  constructor(private readonly db: Firestore) {}

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
    return itens.filter((item) => {
      if (
        filtro?.descricao &&
        !item.descricao.toLowerCase().includes(filtro.descricao.toLowerCase())
      ) {
        return false
      }
      if (
        filtro?.observacao &&
        !item.observacao?.toLowerCase().includes(filtro.observacao.toLowerCase())
      ) {
        return false
      }
      if (filtro?.adquiridoDe && (!item.dataAquisicao || item.dataAquisicao < filtro.adquiridoDe)) {
        return false
      }
      if (filtro?.adquiridoAte && (!item.dataAquisicao || item.dataAquisicao > filtro.adquiridoAte)) {
        return false
      }
      return true
    })
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
