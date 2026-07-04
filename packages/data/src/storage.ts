import { type FirebaseStorage, getDownloadURL, ref, uploadBytes } from 'firebase/storage'

export async function uploadFotoItem(
  storage: FirebaseStorage,
  lojaId: string,
  itemId: string,
  file: File,
): Promise<string> {
  const path = `lojas/${lojaId}/itens/${itemId}/${Date.now()}-${file.name}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
