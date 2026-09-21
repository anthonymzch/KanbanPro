import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Popover anclado a un elemento (una etiqueta de la tarjeta). Va en un portal porque
// las tarjetas y columnas recortan su contenido. Se cierra con Esc, al hacer clic fuera
// o al desplazar el tablero.
export default function QuickPopover({ anchor, onClose, children }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ left: -9999, top: -9999 })

  // Se reposiciona en cada render: el contenido cambia de alto entre pasos
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !anchor.isConnected) return
    const r = anchor.getBoundingClientRect()
    const left = Math.max(8, Math.min(r.left, window.innerWidth - el.offsetWidth - 8))
    let top = r.bottom + 6
    if (top + el.offsetHeight > window.innerHeight - 8) top = Math.max(8, r.top - el.offsetHeight - 6)
    setPos((p) => (p.left === left && p.top === top ? p : { left, top }))
  })

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('scroll', onClose, true)
    window.addEventListener('resize', onClose)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('scroll', onClose, true)
      window.removeEventListener('resize', onClose)
    }
  }, [onClose])

  // Los eventos de un portal suben por el árbol de React hasta la tarjeta (que abriría la
  // tarea o iniciaría un arrastre): se cortan aquí.
  const stop = (e) => e.stopPropagation()

  return createPortal(
    <div
      ref={ref}
      style={{ left: pos.left, top: pos.top }}
      onClick={stop}
      onDoubleClick={stop}
      onPointerDown={stop}
      onKeyDown={stop}
      className="fixed z-[80] w-60 rounded-lg border border-edge bg-surface p-3 shadow-card animate-scale-in"
    >
      {children}
    </div>,
    document.body,
  )
}
