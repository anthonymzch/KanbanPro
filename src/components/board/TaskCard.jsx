import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays, Check, CheckCircle2, Copy, ListChecks, XCircle } from 'lucide-react'
import Badge from '../ui/Badge'
import { useStore } from '../../hooks/useStore'
import { PRIORITIES, projectColor, tagColor } from '../../lib/constants'
import { dueMeta } from '../../lib/dates'

function taskToText(task) {
  const parts = [task.title]
  if (task.description?.trim()) parts.push(task.description.trim())
  if ((task.subtasks || []).length) {
    parts.push(task.subtasks.map((s) => `- [${s.done ? 'x' : ' '}] ${s.title}`).join('\n'))
  }
  return parts.join('\n\n')
}

// Checks de revisión (correcto / a corregir) para tareas que pasaron por "Revisión"
export function ReviewControls({ task, defaultNoteOpen = false }) {
  const { updateTask } = useStore()
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
        <textarea
          rows={2}
          value={correction}
          onChange={(e) => setCorrection(e.target.value)}
          onBlur={saveCorrection}
          placeholder="¿Qué hay que corregir?"
          className="mt-1.5 w-full resize-none rounded-md border border-edge bg-raised p-1.5 text-[11px] text-ink placeholder:text-faint focus:outline-none focus:border-red-400/40"
        />
      )}
    </div>
  )
}

export function CardBody({ task, overlay = false }) {
  const { projects } = useStore()
  const [copied, setCopied] = useState(false)
  const due = dueMeta(task.dueDate)
  const prio = PRIORITIES[task.priority] || PRIORITIES.media
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null
  const subtasks = task.subtasks || []
  const subtasksDone = subtasks.filter((s) => s.done).length

  const handleCopy = async (e) => {
    e.stopPropagation()
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
            <Badge key={tag} className={tagColor(tag)}>
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <p className="text-sm font-medium leading-snug text-ink">{task.title}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge className={prio.badge}>{prio.label}</Badge>
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
        {!overlay && (
          <button
            type="button"
            onClick={handleCopy}
            onPointerDown={(e) => e.stopPropagation()}
            title="Copiar contenido de la tarjeta"
            className="ml-auto rounded-md p-1 text-faint transition-colors hover:bg-raised hover:text-cyan"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          </button>
        )}
      </div>
      {!overlay && task.column === 'review' && <ReviewControls task={task} />}
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
      <CardBody task={task} />
    </div>
  )
}
