import { type FirebaseApp, type FirebaseOptions, initializeApp } from 'firebase/app'

let app: FirebaseApp | undefined

/**
 * Inicializa o Firebase App uma única vez. As opções vêm de variáveis de
 * ambiente do host (Vite no web) — nunca hardcode credenciais aqui.
 */
export function getFirebaseApp(options: FirebaseOptions): FirebaseApp {
  if (!app) {
    app = initializeApp(options)
  }
  return app
}
