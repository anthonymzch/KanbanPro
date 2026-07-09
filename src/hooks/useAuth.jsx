import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
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
      wipLimit: null,
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

  const value = {
    user,
    loading,
    loginGoogle: () => signInWithPopup(auth, googleProvider),
    loginEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
    registerEmail: async (name, email, password) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) await updateProfile(cred.user, { displayName: name })
      await ensureUserDoc({ uid: cred.user.uid, email: cred.user.email, displayName: name })
      return cred
    },
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    logout: () => signOut(auth),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
