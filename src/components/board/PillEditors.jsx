import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import Badge from '../ui/Badge'
import QuickPopover from './QuickPopover'
import { useStore } from '../../hooks/useStore'
import { PRIORITIES, PRIORITY_ORDER, TAG_DOTS, tagColor, tagColorIndex } from '../../lib/constants'
import { inputCls } from '../../lib/ui'

// Doble clic en una etiqueta de la tarjeta: cambiarle el nombre.
//  - nombre de una etiqueta que ya existe → la tarjeta adopta ese color
//  - nombre nuevo → se pregunta qué color darle
//  - vacío → se quita la etiqueta de la tarjeta
export function TagQuickEdit({ task, tag, anchor, onClose }) {
  const { tasks, prefs, updateTask, setTagColor } = useStore()
  const [name, setName] = useState(tag)
  const [pendingName, setPendingName] = useState(null) // paso 2: elegir color

  const existing = useMemo(
    () => [...new Set([...tasks.flatMap((t) => t.tags || []), ...Object.keys(prefs.tagColors || {})])].sort(),
    [tasks, prefs.tagColors],
  )
  const norm = name.trim().toLowerCase()
  const suggestions = existing.filter((t) => t !== tag && (!norm || t.includes(norm))).slice(0, 6)

  // Cambia la etiqueta en esta tarjeta ('' = quitarla)
  const apply = (next) => {
    const tags = (task.tags || [])
      .flatMap((t) => (t === tag ? (next ? [next] : []) : [t]))
      .filter((t, i, all) => all.indexOf(t) === i)
    updateTask(task.id, { tags }, { silent: true })
    onClose()
  }

  const submit = () => {
    if (norm === tag) return onClose()
    if (!norm || existing.includes(norm)) return apply(norm)
    setPendingName(norm)
  }

  if (pendingName) {
    const suggested = tagColorIndex(pendingName)
    return (
      <QuickPopover anchor={anchor} onClose={onClose}>
        <p className="mb-2 text-xs text-muted">
          Etiqueta nueva <span className="font-medium text-ink">{pendingName}</span>: ¿de qué color?
        </p>
        <div className="mb-2 flex flex-wrap gap-2">
          {TAG_DOTS.map((dot, i) => (
            <button
              key={dot}
              type="button"
              onClick={() => {
                setTagColor(pendingName, i)
                apply(pendingName)
              }}
              title={i === suggested ? 'Color sugerido' : undefined}
              className={`h-6 w-6 rounded-full transition ${dot} ${
                i === suggested ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : 'opacity-70 hover:opacity-100'
              }`}
            />
          ))}
        </div>
        <button type="button" onClick={() => setPendingName(null)} className="text-[11px] text-faint hover:text-ink">
          ← Cambiar nombre
        </button>
      </QuickPopover>
    )
  }

  return (
    <QuickPopover anchor={anchor} onClose={onClose}>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submit()
          }
        }}
        placeholder="Nombre de la etiqueta"
        className={inputCls}
      />
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {suggestions.map((t) => (
            <button key={t} type="button" onClick={() => apply(t)}>
              <Badge className={`${tagColor(t)} cursor-pointer`}>{t}</Badge>
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-faint">
        Enter para guardar · vacío para quitarla · si es un nombre nuevo te preguntaré el color
      </p>
    </QuickPopover>
  )
}

// Doble clic en la prioridad de la tarjeta: cambiarla al momento
export function PriorityQuickMenu({ task, anchor, onClose }) {
  const { updateTask } = useStore()
  return (
    <QuickPopover anchor={anchor} onClose={onClose}>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-faint">Prioridad</p>
      <div className="flex flex-wrap gap-1.5">
        {PRIORITY_ORDER.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              if (p !== task.priority) updateTask(task.id, { priority: p }, { silent: true })
              onClose()
            }}
          >
            <Badge className={`${PRIORITIES[p].badge} cursor-pointer`}>
              {task.priority === p && <Check size={10} />}
              {PRIORITIES[p].label}
            </Badge>
          </button>
        ))}
      </div>
    </QuickPopover>
  )
}
