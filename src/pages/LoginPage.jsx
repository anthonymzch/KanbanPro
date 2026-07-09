import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { btnPrimary, inputCls } from '../lib/ui'

const ERRORS = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos',
  'auth/user-not-found': 'No existe una cuenta con ese correo',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-email': 'El correo no es válido',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
  'auth/too-many-requests': 'Demasiados intentos, espera un momento',
  'auth/configuration-not-found': 'Falta habilitar Authentication en la consola de Firebase',
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const { user, loading, loginGoogle, loginEmail, registerEmail, resetPassword } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState('login') // login | register | reset
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  const run = async (fn) => {
    setError('')
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return
      console.error(err)
      setError(ERRORS[err.code] || 'Algo salió mal, inténtalo de nuevo')
    } finally {
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (mode === 'reset') {
      run(async () => {
        await resetPassword(email)
        toast('Te enviamos un correo para restablecer la contraseña', 'info')
        setMode('login')
      })
    } else if (mode === 'register') {
      run(() => registerEmail(name.trim(), email, password))
    } else {
      run(() => loginEmail(email, password))
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-base p-4">
      {/* Decoración de fondo */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-electric/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-violet/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-2xl border border-edge bg-surface/90 p-8 shadow-card backdrop-blur animate-slide-up">
        <span className="eyebrow">&lt;kanbanpro /&gt;</span>
        <h1 className="grad-text mt-1 font-display text-3xl font-bold">KanbanPro</h1>
        <p className="mt-2 text-sm text-muted">
          {mode === 'login' && 'Tu trabajo y tus ideas, en un solo tablero.'}
          {mode === 'register' && 'Crea tu cuenta y organiza tu primer tablero.'}
          {mode === 'reset' && 'Escribe tu correo y te enviamos un enlace de recuperación.'}
        </p>

        {mode !== 'reset' && (
          <>
            <button
              onClick={() => run(loginGoogle)}
              disabled={busy}
              className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg border border-edge bg-raised px-4 py-2.5 text-sm font-medium text-ink transition-all hover:border-cyan/40 hover:shadow-glow disabled:opacity-50"
            >
              <GoogleIcon />
              Continuar con Google
            </button>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-edge" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-faint">o con tu correo</span>
              <div className="h-px flex-1 bg-edge" />
            </div>
          </>
        )}
        {mode === 'reset' && <div className="mt-6" />}

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className={inputCls} />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className={inputCls}
          />
          {mode !== 'reset' && (
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className={inputCls}
            />
          )}
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={busy} className={`${btnPrimary} flex w-full items-center justify-center gap-2 py-2.5`}>
            {busy && <Loader2 size={14} className="animate-spin" />}
            {mode === 'login' && 'Entrar'}
            {mode === 'register' && 'Crear cuenta'}
            {mode === 'reset' && 'Enviar enlace'}
          </button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-1.5 text-xs text-muted">
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('register')} className="transition-colors hover:text-cyan">
                ¿No tienes cuenta? <span className="font-medium text-ink">Regístrate</span>
              </button>
              <button onClick={() => setMode('reset')} className="text-faint transition-colors hover:text-cyan">
                Olvidé mi contraseña
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button onClick={() => setMode('login')} className="flex items-center gap-1 transition-colors hover:text-cyan">
              <ArrowLeft size={12} /> Volver a iniciar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
