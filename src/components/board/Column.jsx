import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AlertTriangle, Inbox, Settings2 } from 'lucide-react'
import TaskCard from './TaskCard'
import QuickAdd from './QuickAdd'
import EmptyState from '../ui/EmptyState'
import { useStore } from '../../hooks/useStore'

const DOTS = {
  backlog: 'bg-slate-400',
  todo: 'bg-blue-400',
  inprogress: 'bg-cyan',
  done: 'bg-emerald-400',
  archived: 'bg-slate-600',
}

const EMPTY_HINTS = {
  backlog: 'Todo empieza aquí',
  todo: 'Nada pendiente por ahora',
  inprogress: 'Arrastra algo para empezar',
  done: 'Aún no hay victorias hoy',
  archived: 'El archivo está vacío',
}

function WipEditor({ wipLimit, onSave, onClose }) {
  const [val, setVal] = useState(wipLimit ?? '')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const n = parseInt(val, 10)
        onSave(Number.isFinite(n) && n > 0 ? n : null)
        onClose()
      }}
      className="flex items-center gap-1"
    >
      <input
        autoFocus
        type="number"
        min="1"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={onClose}
        placeholder="∞"
        title="Límite WIP (vacío = sin límite)"
        className="w-12 rounded border border-edge bg-raised px-1 py-0.5 text-center text-xs text-ink focus:outline-none"
      />
    </form>
  )
}

export default function Column({ column, tasks, onCardClick }) {
  const { prefs, setWipLimit } = useStore()
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const [editingWip, setEditingWip] = useState(false)

  const isWipCol = column.id === 'inprogress'
  const wipLimit = prefs.wipLimit
  const overWip = isWipCol && wipLimit && tasks.length > wipLimit

  return (
    <section
      className={`flex h-full w-[280px] shrink-0 flex-col rounded-xl border bg-surface/50 transition-shadow ${
        overWip ? 'border-red-500/40 ring-1 ring-red-500/30' : isOver ? 'border-cyan/40' : 'border-edge'
      }`}
    >
      <header className="flex items-center gap-2 px-3 pb-1 pt-3">
        <span className={`h-2 w-2 rounded-full ${DOTS[column.id]}`} />
        <h3 className="font-display text-sm font-semibold text-ink">{column.label}</h3>
        <span
          className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${
            overWip ? 'bg-red-500/15 text-red-400' : 'bg-raised text-faint'
          }`}
        >
          {tasks.length}
          {isWipCol && wipLimit ? `/${wipLimit}` : ''}
        </span>
        {isWipCol && (
          <span className="ml-auto flex items-center gap-1">
            {overWip && (
              <span title="Límite WIP superado">
                <AlertTriangle size={13} className="text-red-400" />
              </span>
            )}
            {editingWip ? (
              <WipEditor wipLimit={wipLimit} onSave={setWipLimit} onClose={() => setEditingWip(false)} />
            ) : (
              <button
                onClick={() => setEditingWip(true)}
                title="Configurar límite WIP"
                className="rounded p-1 text-faint opacity-60 transition-opacity hover:text-ink hover:opacity-100"
              >
                <Settings2 size={13} />
              </button>
            )}
          </span>
        )}
      </header>
      {overWip && (
        <p className="mx-3 mb-1 rounded-md bg-red-500/10 px-2 py-1 text-[11px] text-red-400">
          Límite WIP superado — termina algo antes de empezar más.
        </p>
      )}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
          {tasks.length === 0 ? (
            <EmptyState icon={Inbox} title={EMPTY_HINTS[column.id]} compact />
          ) : (
            tasks.map((task) => <TaskCard key={task.id} task={task} onClick={onCardClick} />)
          )}
        </div>
      </SortableContext>
      <QuickAdd column={column.id} />
    </section>
  )
}
