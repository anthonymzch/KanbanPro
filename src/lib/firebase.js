import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyD1kWZARq-8Wrrp78EyCORJcZKeVs4rLZM',
  authDomain: 'kanbanpro-anthony.firebaseapp.com',
  projectId: 'kanbanpro-anthony',
  storageBucket: 'kanbanpro-anthony.firebasestorage.app',
  messagingSenderId: '625271239782',
  appId: '1:625271239782:web:4392ed966f8873139ea9a7',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
