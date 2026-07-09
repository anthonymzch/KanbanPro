import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ onClose, children, title, eyebrow, wide = false }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative flex min-h-full items-start justify-center p-4 pt-[8vh]">
        <div
          className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-2xl border border-edge bg-surface p-6 shadow-card animate-scale-in`}
        >
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-faint transition-colors hover:bg-raised hover:text-ink"
          >
            <X size={16} />
          </button>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          {title && <h2 className="mt-1 font-display text-lg font-semibold text-ink">{title}</h2>}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
