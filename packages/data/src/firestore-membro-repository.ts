import type { Membro, MembroRepository, PapelUsuario } from '@prumo/core'
import { type Firestore, Timestamp, collection, doc, getDoc, getDocs } from 'firebase/firestore'

function toMembro(uid: string, data: Record<string, unknown>): Membro {
  // Tolerante a documentos antigos que só têm `papel` (bootstrap manual do
  // admin piloto): os demais campos ganham defaults seguros.
  return {
    uid,
    email: (data.email as string) ?? '',
    displayName: (data.displayName as string) ?? '',
    papel: data.papel as PapelUsuario,
    disabled: (data.disabled as boolean) ?? false,
    criadoEm: data.criadoEm ? (data.criadoEm as Timestamp).toDate() : undefined,
    atualizadoEm: data.atualizadoEm ? (data.atualizadoEm as Timestamp).toDate() : undefined,
  }
}

export class FirestoreMembroRepository implements MembroRepository {
  private readonly db: Firestore

  constructor(db: Firestore) {
    this.db = db
  }

  async getMembro(lojaId: string, uid: string): Promise<Membro | null> {
    const ref = doc(this.db, `lojas/${lojaId}/membros/${uid}`)
    const snapshot = await getDoc(ref)
    if (!snapshot.exists()) return null
    return toMembro(uid, snapshot.data())
  }

  async listMembros(lojaId: string): Promise<Membro[]> {
    const ref = collection(this.db, `lojas/${lojaId}/membros`)
    const snapshot = await getDocs(ref)
    return snapshot.docs.map((d) => toMembro(d.id, d.data()))
  }
}
