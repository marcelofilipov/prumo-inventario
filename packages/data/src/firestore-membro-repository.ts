import type { Membro, MembroRepository } from '@prumo/core'
import { type Firestore, doc, getDoc } from 'firebase/firestore'

export class FirestoreMembroRepository implements MembroRepository {
  private readonly db: Firestore

  constructor(db: Firestore) {
    this.db = db
  }

  async getMembro(lojaId: string, uid: string): Promise<Membro | null> {
    const ref = doc(this.db, `lojas/${lojaId}/membros/${uid}`)
    const snapshot = await getDoc(ref)
    if (!snapshot.exists()) return null
    return { uid, papel: snapshot.data().papel as Membro['papel'] }
  }
}
