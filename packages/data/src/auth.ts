import {
  type Auth,
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

export function signIn(auth: Auth, email: string, password: string): Promise<User> {
  return signInWithEmailAndPassword(auth, email, password).then((cred) => cred.user)
}

export function signOutUser(auth: Auth): Promise<void> {
  return signOut(auth)
}

export function observeAuthState(
  auth: Auth,
  callback: (user: User | null) => void,
): () => void {
  return onAuthStateChanged(auth, callback)
}
