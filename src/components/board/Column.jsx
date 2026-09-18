import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  AlertTriangle,
  Check,
  Clipboard,
  Eye,
  History,
  Inbox,
  MessageSquareText,
  Send,
  Settings2,
  Wrench,
} from 'lucide-react'
import TaskCard from './TaskCard'
import QuickAdd from './QuickAdd'
import EmptyState from '../ui/EmptyState'
import { useStore } from '../../hooks/useStore'
import { buildColumnExport, buildCorrectionsExport } from '../../lib/exportTasks'
import { DEFAULT_EXPORT_PROMPT, EXPORT_PROMPT_PRESETS, projectColor } from '../../lib/constants'
import { isWithinDays } from '../../lib/dates'
import { splitReviewNotes } from '../../lib/reviewNotes'

const DOTS = {
  backlog: 'bg-slate-400',
  todo: 'bg-blue-400',
  inprogress: 'bg-cyan',
  review: 'bg-amber-400',
  done: 'bg-emerald-400',
  archived: 'bg-slate-600',
}

const EMPTY_HINTS = {
  backlog: 'Todo empieza aquí',
  todo: 'Nada pendiente por ahora',
  inprogress: 'Arrastra algo para empezar',
  review: 'Nada en revisión todavía',
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

function PromptEditor({ value, onSave, onClose }) {
  const [text, setText] = useState(value)
  return (
    <div className="absolute right-0 top-9 z-20 w-72 rounded-lg border border-edge bg-surface p-3 shadow-card">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-faint">Instrucciones para Claude</p>
      <div className="mb-2 flex flex-wrap gap-1">
        {EXPORT_PROMPT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setText(preset.text)}
            className="rounded-md border border-edge bg-raised px-2 py-1 text-[11px] text-muted transition-colors hover:border-cyan/40 hover:text-ink"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <textarea
        autoFocus
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-none rounded-md border border-edge bg-raised p-2 text-xs leading-relaxed text-ink focus:outline-none focus:border-cyan/40"
      />
      <div className="mt-2 flex justify-end gap-1.5">
        <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-[11px] text-faint hover:text-ink">
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => {
            onSave(text.trim() || null)
            onClose()
          }}
          className="rounded-md bg-cyan/20 px-2 py-1 text-[11px] font-medium text-cyan transition-colors hover:bg-cyan/30"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}

function SendToReviewEditor({ onSave, onClose }) {
  const [note, setNote] = useState('')
  return (
    <div className="absolute right-0 top-9 z-20 w-72 rounded-lg border border-edge bg-surface p-3 shadow-card">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-faint">Pega el "qué hice" de Claude</p>
      <p className="mb-2 text-[11px] leading-relaxed text-faint">
        Si viene con un bloque "### Tarea: título" por cada tarea, cada nota va a su tarjeta. Si no, se copia entera a
        todas.
      </p>
      <textarea
        autoFocus
        rows={5}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Pega aquí el resumen que te dio Claude…"
        className="w-full resize-none rounded-md border border-edge bg-raised p-2 text-xs leading-relaxed text-ink focus:outline-none focus:border-cyan/40"
      />
      <div className="mt-2 flex justify-end gap-1.5">
        <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-[11px] text-faint hover:text-ink">
          Cancelar
        </button>
        <button
          type="button"
          disabled={!note.trim()}
          onClick={() => {
            onSave(note.trim())
            onClose()
          }}
          className="rounded-md bg-cyan/20 px-2 py-1 text-[11px] font-medium text-cyan transition-colors hover:bg-cyan/30 disabled:pointer-events-none disabled:opacity-40"
        >
          Enviar a revisión
        </button>
      </div>
    </div>
  )
}

export default function Column({ column, tasks, onCardClick }) {
  const { prefs, setWipLimit, setHiddenColumns, setExportPrompt, projects, sendToReview } = useStore()
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const [editingWip, setEditingWip] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState(false)
  const [sendingReview, setSendingReview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [correctionsCopied, setCorrectionsCopied] = useState(false)
  const [weekOnly, setWeekOnly] = useState(false)

  const isWipCol = column.id === 'inprogress'
  const isDoneCol = column.id === 'done'
  const isReviewCol = column.id === 'review'
  const wipLimit = prefs.wipLimit
  const overWip = isWipCol && wipLimit && tasks.length > wipLimit
  const exportPrompt = prefs.exportPrompt || DEFAULT_EXPORT_PROMPT

  const visibleTasks = isDoneCol && weekOnly ? tasks.filter((t) => isWithinDays(t.updatedAt, 7)) : tasks
  const fixCount = isReviewCol
    ? tasks.filter((t) => t.reviewStatus === 'fix' && t.correctionNote?.trim()).length
    : 0

  const handleCopyColumn = async () => {
    try {
      await navigator.clipboard.writeText(buildColumnExport(column, visibleTasks, projects, exportPrompt))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard no disponible
    }
  }

  const hideThisColumn = () => {
    const hidden = prefs.hiddenColumns || []
    if (!hidden.includes(column.id)) setHiddenColumns([...hidden, column.id])
  }

  const handleCopyCorrections = async () => {
    try {
      await navigator.clipboard.writeText(buildCorrectionsExport(tasks, projects))
      setCorrectionsCopied(true)
      setTimeout(() => setCorrectionsCopied(false), 1500)
    } catch {
      // clipboard no disponible
    }
  }

  return (
    <section
      className={`relative flex h-full w-[280px] shrink-0 flex-col rounded-xl border bg-surface/50 transition-shadow ${
        overWip ? 'border-red-500/40 ring-1 ring-red-500/30' : isOver ? 'border-cyan/40' : 'border-edge'
      }`}
    >
      <header className="flex items-center gap-2 px-3 pb-1 pt-3">
        <span
          className={`h-2 w-2 rounded-full ${column.custom ? projectColor(column.color).dot : DOTS[column.id] || 'bg-slate-400'}`}
        />
        <h3 className="font-display text-sm font-semibold text-ink">{column.label}</h3>
        <span
          className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${
            overWip ? 'bg-red-500/15 text-red-400' : 'bg-raised text-faint'
          }`}
        >
          {visibleTasks.length}
          {isWipCol && wipLimit ? `/${wipLimit}` : ''}
        </span>
        <span className="ml-auto flex items-center gap-1">
          {isWipCol && overWip && (
            <span title="Límite WIP superado">
              <AlertTriangle size={13} className="text-red-400" />
            </span>
          )}
          {isDoneCol && (
            <button
              onClick={() => setWeekOnly((w) => !w)}
              title={weekOnly ? 'Mostrar todo el historial' : 'Mostrar solo lo completado esta semana'}
              className={`rounded p-1 transition-opacity hover:opacity-100 ${
                weekOnly ? 'text-cyan opacity-100' : 'text-faint opacity-60 hover:text-ink'
              }`}
            >
              <History size={13} />
            </button>
          )}
          {isWipCol &&
            (editingWip ? (
              <WipEditor wipLimit={wipLimit} onSave={setWipLimit} onClose={() => setEditingWip(false)} />
            ) : (
              <button
                onClick={() => setEditingWip(true)}
                title="Configurar límite WIP"
                className="rounded p-1 text-faint opacity-60 transition-opacity hover:text-ink hover:opacity-100"
              >
                <Settings2 size={13} />
              </button>
            ))}
          {isWipCol && (
            <button
              onClick={() => setSendingReview(true)}
              disabled={tasks.length === 0}
              title="Enviar todo a Revisión junto con la nota de Claude"
              className="rounded p-1 text-faint opacity-60 transition-opacity hover:text-ink hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:text-faint"
            >
              <Send size={13} />
            </button>
          )}
          {isReviewCol && (
            <button
              onClick={handleCopyCorrections}
              disabled={fixCount === 0}
              title="Copiar las correcciones pendientes para pegarlas en Claude"
              className="rounded p-1 text-faint opacity-60 transition-opacity hover:text-ink hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:text-faint"
            >
              {correctionsCopied ? <Check size={13} className="text-emerald-400" /> : <Wrench size={13} />}
            </button>
          )}
          <button
            onClick={() => setEditingPrompt(true)}
            title="Cambiar las instrucciones que se copian con las tareas"
            className="rounded p-1 text-faint opacity-60 transition-opacity hover:text-ink hover:opacity-100"
          >
            <MessageSquareText size={13} />
          </button>
          <button
            onClick={handleCopyColumn}
            disabled={tasks.length === 0}
            title="Copiar las tareas de esta columna para pegarlas en Claude"
            className="rounded p-1 text-faint opacity-60 transition-opacity hover:text-ink hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:text-faint"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Clipboard size={13} />}
          </button>
          <button
            onClick={hideThisColumn}
            title="Ocultar esta columna"
            className="rounded p-1 text-faint opacity-60 transition-opacity hover:text-ink hover:opacity-100"
          >
            <Eye size={13} />
          </button>
        </span>
        {editingPrompt && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setEditingPrompt(false)} />
            <PromptEditor value={exportPrompt} onSave={setExportPrompt} onClose={() => setEditingPrompt(false)} />
          </>
        )}
        {sendingReview && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setSendingReview(false)} />
            <SendToReviewEditor
              onSave={(note) => {
                const perTask = splitReviewNotes(note, tasks)
                sendToReview(tasks.map((t) => ({ id: t.id, note: perTask?.[t.id] || note })))
              }}
              onClose={() => setSendingReview(false)}
            />
          </>
        )}
      </header>
      {overWip && (
        <p className="mx-3 mb-1 rounded-md bg-red-500/10 px-2 py-1 text-[11px] text-red-400">
          Límite WIP superado — termina algo antes de empezar más.
        </p>
      )}
      <SortableContext items={visibleTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
          {visibleTasks.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={
                isDoneCol && weekOnly && tasks.length > 0
                  ? 'Nada completado esta semana'
                  : EMPTY_HINTS[column.id] || 'Sin tareas'
              }
              compact
            />
          ) : (
            visibleTasks.map((task) => <TaskCard key={task.id} task={task} onClick={onCardClick} />)
          )}
        </div>
      </SortableContext>
      <QuickAdd column={column.id} />
    </section>
  )
}
