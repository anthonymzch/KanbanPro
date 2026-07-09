import { createContext, useCallback, useContext, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'

const ToastContext = createContext(() => {})
let nextId = 0

const STYLES = {
  success: { icon: CheckCircle2, cls: 'border-emerald-500/30 text-emerald-400' },
  error: { icon: AlertTriangle, cls: 'border-red-500/30 text-red-400' },
  info: { icon: Info, cls: 'border-cyan/30 text-cyan' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = ++nextId
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2">
        {toasts.map((t) => {
          const { icon: Icon, cls } = STYLES[t.type] || STYLES.info
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-lg border bg-surface/95 px-4 py-2.5 text-sm text-ink shadow-card backdrop-blur animate-slide-up ${cls}`}
            >
              <Icon size={16} className="shrink-0" />
              <span>{t.message}</span>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
