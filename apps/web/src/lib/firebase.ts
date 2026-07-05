import { getFirebaseApp } from '@prumo/data'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Exportado para criar um app secundário ao cadastrar usuários (ver
// membros-admin), sem perturbar a sessão do admin logado.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = getFirebaseApp(firebaseConfig)

export const auth = getAuth(app)
// ignoreUndefinedProperties: campos opcionais do formulário (localização,
// observação, data de aquisição, valor estimado) viram `undefined` quando
// deixados em branco, e o Firestore rejeita `undefined` em escritas por
// padrão.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true })
export const storage = getStorage(app)

// Para testar localmente contra os emuladores (Auth + Firestore), rode
// `firebase emulators:start --only auth,firestore` e defina
// VITE_USE_EMULATORS=true no .env.local.
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}

// lojaId da Loja piloto (ARLS João Ramalho nº 107). Quando o produto
// atender mais de uma Loja, isso deixa de ser uma env var fixa e passa a
// vir do contexto de login do usuário.
export const lojaId = import.meta.env.VITE_LOJA_ID
