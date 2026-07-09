import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarDays } from 'lucide-react'
import Badge from '../ui/Badge'
import { PRIORITIES, tagColor } from '../../lib/constants'
import { dueMeta } from '../../lib/dates'

export function CardBody({ task, overlay = false }) {
  const due = dueMeta(task.dueDate)
  const prio = PRIORITIES[task.priority] || PRIORITIES.media

  return (
    <div
      className={`group cursor-pointer rounded-xl border bg-surface p-3 shadow-card transition-all ${
        overlay
          ? 'rotate-2 border-cyan/50 shadow-glow'
          : 'border-edge hover:border-cyan/40 hover:shadow-glow animate-fade-in'
      }`}
    >
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
