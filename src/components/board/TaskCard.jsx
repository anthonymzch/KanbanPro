import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays, Check, Copy, ListChecks } from 'lucide-react'
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
