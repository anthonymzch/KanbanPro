import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'

const AuthContext = createContext(null)

// Crea el perfil en users/{uid} la primera vez que entra un usuario.
async function ensureUserDoc({ uid, email, displayName }) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      email: email || '',
      displayName: displayName || '',
      theme: 'dark',
      createdAt: serverTimestamp(),
    })
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        if (u) await ensureUserDoc(u).catch(console.error)
        setUser(u)
        setLoading(false)
      }),
    [],
  )

  const loginGoogle = async () => {
    if (!Capacitor.isNativePlatform()) return signInWithPopup(auth, googleProvider)

    const result = await FirebaseAuthentication.signInWithGoogle()
    const { idToken, accessToken } = result.credential || {}
    if (!idToken) throw new Error('No se recibió la credencial de Google')
    return signInWithCredential(auth, GoogleAuthProvider.credential(idToken, accessToken))
  }

  const logout = async () => {
    if (Capacitor.isNativePlatform()) await FirebaseAuthentication.signOut().catch(() => {})
    return signOut(auth)
  }

  const value = {
    user,
    loading,
    loginGoogle,
    loginEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
    registerEmail: async (name, email, password) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) await updateProfile(cred.user, { displayName: name })
      await ensureUserDoc({ uid: cred.user.uid, email: cred.user.email, displayName: name })
      return cred
    },
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
