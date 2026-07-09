import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import { StoreProvider } from './hooks/useStore'
import { UIProvider } from './hooks/useUI'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import BoardPage from './pages/BoardPage'
import IdeasPage from './pages/IdeasPage'

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-base">
      <div className="flex flex-col items-center gap-3">
        <span className="eyebrow">&lt;kanbanpro /&gt;</span>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-raised">
          <div className="grad-accent h-full w-1/2 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  )
}

function Protected() {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  return (
    <StoreProvider>
      <UIProvider>
        <AppShell />
      </UIProvider>
    </StoreProvider>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<Protected />}>
              <Route path="/" element={<BoardPage />} />
              <Route path="/ideas" element={<IdeasPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
