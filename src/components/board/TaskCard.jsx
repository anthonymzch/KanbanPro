import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Copy,
  ImageIcon,
  ListChecks,
  Loader2,
  Paperclip,
  X,
  XCircle,
} from 'lucide-react'
import Badge from '../ui/Badge'
import { PriorityQuickMenu, TagQuickEdit } from './PillEditors'
import { useStore } from '../../hooks/useStore'
import { PRIORITIES, projectColor, tagColor } from '../../lib/constants'
import { celebrate } from '../../lib/celebrate'
import { dueMeta } from '../../lib/dates'

function taskToText(task) {
  const parts = [task.title]
  if (task.description?.trim()) parts.push(task.description.trim())
  if ((task.subtasks || []).length) {
    parts.push(task.subtasks.map((s) => `- [${s.done ? 'x' : ' '}] ${s.title}`).join('\n'))
  }
  if ((task.images || []).length) {
    parts.push(`Capturas de pantalla (${task.images.length}):\n${task.images.map((url, i) => `${i + 1}. ${url}`).join('\n')}`)
  }
  return parts.join('\n\n')
}

// Capturas de pantalla adjuntas a la corrección de una tarea
function CorrectionImages({ task }) {
  const { addCorrectionImage, removeCorrectionImage } = useStore()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const images = task.correctionImages || []

  const handleFiles = async (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      await addCorrectionImage(task.id, file)
    }
    setUploading(false)
  }

  return (
    <div className="mt-1.5">
      {images.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {images.map((url) => (
            <div key={url} className="group/img relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-edge">
              <a href={url} target="_blank" rel="noreferrer" title="Abrir en pestaña nueva (clic derecho para copiar la imagen)">
                <img src={url} alt="Captura de pantalla" className="h-full w-full object-cover" />
              </a>
              <button
                type="button"
                onClick={() => removeCorrectionImage(task.id, url)}
                title="Quitar captura"
                className="absolute right-0 top-0 rounded-bl-md bg-black/60 p-0.5 text-white opacity-0 transition-opacity group-hover/img:opacity-100"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1 rounded-md border border-dashed border-edge px-2 py-1 text-[11px] text-faint transition-colors hover:border-cyan/40 hover:text-ink disabled:opacity-50"
      >
        {uploading ? <Loader2 size={11} className="animate-spin" /> : <Paperclip size={11} />}
        {uploading ? 'Subiendo…' : 'Adjuntar captura'}
      </button>
    </div>
  )
}

// Checks de revisión (correcto / a corregir) para tareas que pasaron por "Revisión"
export function ReviewControls({ task, defaultNoteOpen = false }) {
  const { updateTask, addCorrectionImage } = useStore()
  const [correction, setCorrection] = useState(task.correctionNote || '')
  const [noteOpen, setNoteOpen] = useState(defaultNoteOpen)

  const setStatus = (status) => () => {
    updateTask(task.id, { reviewStatus: status, ...(status === 'ok' ? { correctionNote: null } : {}) }, { silent: true })
    if (status === 'ok') setCorrection('')
  }

  const saveCorrection = () => {
    updateTask(task.id, { correctionNote: correction.trim() || null }, { silent: true })
  }

  return (
    <div
      className="mt-2 border-t border-edge pt-2"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {task.reviewNote && (
        <button
          type="button"
          onClick={() => setNoteOpen((o) => !o)}
          className="mb-1.5 text-left text-[11px] text-faint underline decoration-dotted hover:text-ink"
        >
          {noteOpen ? 'Ocultar' : 'Ver'} nota de Claude
        </button>
      )}
      {noteOpen && (
        <p className="mb-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md bg-raised p-2 text-[11px] leading-relaxed text-muted">
          {task.reviewNote}
        </p>
      )}
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={setStatus('ok')}
          className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
            task.reviewStatus === 'ok'
              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
              : 'border-edge text-faint hover:text-ink'
          }`}
        >
          <CheckCircle2 size={12} /> Correcto
        </button>
        <button
          type="button"
          onClick={setStatus('fix')}
          className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
            task.reviewStatus === 'fix'
              ? 'border-red-500/40 bg-red-500/15 text-red-400'
              : 'border-edge text-faint hover:text-ink'
          }`}
        >
          <XCircle size={12} /> Corregir
        </button>
      </div>
      {task.reviewStatus === 'fix' && (
        <>
          <textarea
            rows={2}
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            onBlur={saveCorrection}
            onPaste={(e) => {
              const item = [...(e.clipboardData?.items || [])].find((it) => it.type.startsWith('image/'))
              if (!item) return
              e.preventDefault()
              const file = item.getAsFile()
              if (file) addCorrectionImage(task.id, file)
            }}
            placeholder="¿Qué hay que corregir? (puedes pegar una captura aquí)"
            className="mt-1.5 w-full resize-none rounded-md border border-edge bg-raised p-1.5 text-[11px] text-ink placeholder:text-faint focus:outline-none focus:border-red-400/40"
          />
          <CorrectionImages task={task} />
        </>
      )}
    </div>
  )
}

// Botón de acción de la tarjeta (no debe abrir la tarea ni iniciar un arrastre)
function CardAction({ onClick, title, disabled, className = 'hover:text-cyan', children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      title={title}
      aria-label={title}
      className={`rounded-md p-1 text-faint transition-colors hover:bg-raised disabled:pointer-events-none disabled:opacity-25 ${className}`}
    >
      {children}
    </button>
  )
}

export function CardBody({ task, overlay = false, onOpen }) {
  const { projects, columns, prefs, sendTaskToColumn, markTaskDone } = useStore()
  const [copied, setCopied] = useState(false)
  // Editor rápido abierto sobre una etiqueta o la prioridad: { type: 'tag'|'priority', tag?, anchor }
  const [quickEdit, setQuickEdit] = useState(null)
  const clickTimer = useRef(null)
  useEffect(() => () => clearTimeout(clickTimer.current), [])

  // Un clic en una etiqueta abre la tarea (como el resto de la tarjeta) pero con una pequeña
  // espera, para poder distinguirlo del doble clic que abre el editor rápido.
  const pillProps = (openEditor) =>
    overlay
      ? {}
      : {
          onClick: (e) => {
            e.stopPropagation()
            clearTimeout(clickTimer.current)
            clickTimer.current = setTimeout(() => onOpen?.(), 250)
          },
          onDoubleClick: (e) => {
            e.stopPropagation()
            clearTimeout(clickTimer.current)
            openEditor(e.currentTarget)
          },
        }

  // Columnas vecinas (solo entre las visibles) para las flechas
  const shownColumns = columns.filter((c) => !(prefs.hiddenColumns || []).includes(c.id))
  const colIdx = shownColumns.findIndex((c) => c.id === task.column)
  const prevColumn = colIdx > 0 ? shownColumns[colIdx - 1] : null
  const nextColumn = colIdx >= 0 && colIdx < shownColumns.length - 1 ? shownColumns[colIdx + 1] : null
  const canFinish = task.column !== 'done' && task.column !== 'archived'

  const finish = () => {
    markTaskDone(task.id)
    celebrate()
  }
  const moveTo = (column) => (column.id === 'done' ? finish() : sendTaskToColumn(task.id, column.id))
  const due = dueMeta(task.dueDate)
  const prio = PRIORITIES[task.priority] || PRIORITIES.media
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null
  const subtasks = task.subtasks || []
  const subtasksDone = subtasks.filter((s) => s.done).length

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(taskToText(task))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard no disponible
    }
  }

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-xl border bg-surface p-3 shadow-card transition-all ${
        project ? 'pl-4' : ''
      } ${
        overlay
          ? 'rotate-2 border-cyan/50 shadow-glow'
          : 'border-edge hover:border-cyan/40 hover:shadow-glow animate-fade-in'
      }`}
    >
      {project && (
        <>
          <span className={`absolute inset-y-0 left-0 w-1 ${projectColor(project.color).dot}`} />
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${projectColor(project.color).dot}`} />
            <span className="truncate font-mono text-[10px] tracking-wide text-muted">{project.name}</span>
          </div>
        </>
      )}
      {(task.tags || []).length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <Badge
              key={tag}
              className={`${tagColor(tag)} ${overlay ? '' : 'cursor-pointer select-none'}`}
              title={overlay ? undefined : 'Doble clic para cambiarle el nombre o el color'}
              {...pillProps((anchor) => setQuickEdit({ type: 'tag', tag, anchor }))}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <p className="text-sm font-medium leading-snug text-ink">{task.title}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge
          className={`${prio.badge} ${overlay ? '' : 'cursor-pointer select-none'}`}
          title={overlay ? undefined : 'Doble clic para cambiar la prioridad'}
          {...pillProps((anchor) => setQuickEdit({ type: 'priority', anchor }))}
        >
          {prio.label}
        </Badge>
        {due && (
          <Badge
            className={
              due.overdue
                ? 'border-red-500/40 bg-red-500/15 text-red-400'
                : due.soon
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                  : 'border-edge bg-raised text-faint'
            }
          >
            <CalendarDays size={11} />
            {due.label}
          </Badge>
        )}
        {subtasks.length > 0 && (
          <Badge
            className={
              subtasksDone === subtasks.length
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                : 'border-edge bg-raised text-faint'
            }
          >
            <ListChecks size={11} />
            {subtasksDone}/{subtasks.length}
          </Badge>
        )}
        {(task.images || []).length > 0 && (
          <Badge className="border-edge bg-raised text-faint" title="Capturas de pantalla adjuntas">
            <ImageIcon size={11} />
            {task.images.length}
          </Badge>
        )}
        {!overlay && (
          <span className="ml-auto flex items-center">
            <CardAction
              onClick={() => prevColumn && moveTo(prevColumn)}
              disabled={!prevColumn}
              title={prevColumn ? `Mover a ${prevColumn.label}` : 'No hay columna a la izquierda'}
            >
              <ChevronLeft size={14} />
            </CardAction>
            <CardAction
              onClick={() => nextColumn && moveTo(nextColumn)}
              disabled={!nextColumn}
              title={nextColumn ? `Mover a ${nextColumn.label}` : 'No hay columna a la derecha'}
            >
              <ChevronRight size={14} />
            </CardAction>
            {canFinish && (
              <CardAction onClick={finish} title="Marcar como hecha" className="hover:text-emerald-400">
                <CircleCheckBig size={13} />
              </CardAction>
            )}
            <CardAction onClick={handleCopy} title="Copiar contenido de la tarjeta">
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </CardAction>
          </span>
        )}
      </div>
      {!overlay && task.column === 'review' && <ReviewControls task={task} />}
      {quickEdit?.type === 'tag' && (
        <TagQuickEdit task={task} tag={quickEdit.tag} anchor={quickEdit.anchor} onClose={() => setQuickEdit(null)} />
      )}
      {quickEdit?.type === 'priority' && (
        <PriorityQuickMenu task={task} anchor={quickEdit.anchor} onClose={() => setQuickEdit(null)} />
      )}
    </div>
  )
}

export default function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-30' : ''}
      onClick={() => onClick(task)}
      {...attributes}
      {...listeners}
    >
      <CardBody task={task} onOpen={() => onClick(task)} />
    </div>
  )
}
