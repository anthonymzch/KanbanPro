import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { projectColor } from '../../lib/constants'
import { selectCls } from '../../lib/ui'

export default function ProjectMultiSelect({ projects, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onEscape = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  const label =
    value.length === 0
      ? 'Proyecto'
      : value.length === 1
        ? projects.find((p) => p.id === value[0])?.name || 'Proyecto'
        : `${value.length} proyectos`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${selectCls} flex items-center gap-1.5 py-1.5 pr-2.5`}
      >
        {label}
        <ChevronDown size={13} className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-[180px] rounded-lg border border-edge bg-surface p-1 shadow-card">
          <div className="flex items-center gap-1 border-b border-edge px-2 py-1.5">
            <button
              type="button"
              onClick={() => onChange(projects.map((p) => p.id))}
              className="rounded-md px-1.5 py-0.5 text-[11px] text-faint transition-colors hover:text-ink"
            >
              Todos
            </button>
            <span className="text-[11px] text-faint">·</span>
            <button
              type="button"
              onClick={() => onChange([])}
              className="rounded-md px-1.5 py-0.5 text-[11px] text-faint transition-colors hover:text-ink"
            >
              Ninguno
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {projects.map((p) => {
              const checked = value.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink transition-colors hover:bg-raised"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked ? 'border-cyan bg-cyan/20' : 'border-edge'
                    }`}
                  >
                    {checked && <Check size={11} className="text-cyan" />}
                  </span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${projectColor(p.color).dot}`} />
                  <span className="flex-1 truncate text-left">{p.name}</span>
                </button>
              )
            })}
            {projects.length === 0 && <div className="px-2 py-1.5 text-xs text-faint">Sin proyectos</div>}
          </div>
        </div>
      )}
    </div>
  )
}
