import { FirestoreInventoryRepository, FirestoreMembroRepository } from '@prumo/data'
import { db } from './firebase'

export const inventoryRepository = new FirestoreInventoryRepository(db)
export const membroRepository = new FirestoreMembroRepository(db)
