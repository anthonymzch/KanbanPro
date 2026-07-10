import { useState } from 'react'
import { CheckCircle2, ChevronUp, Pencil, Send, Trash2 } from 'lucide-react'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import { IDEA_CATEGORIES, IDEA_STATUSES, IDEA_STATUS_ORDER, projectColor } from '../../lib/constants'

export default function IdeaCard({ idea }) {
  const { voteIdea, updateIdea, deleteIdea, convertIdea, projects } = useStore()
  const { openIdeaModal } = useUI()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [voted, setVoted] = useState(false)

  const status = IDEA_STATUSES[idea.status] || IDEA_STATUSES.nueva
  const category = IDEA_CATEGORIES[idea.category] || IDEA_CATEGORIES['nueva-app']

  const vote = () => {
    voteIdea(idea.id)
    setVoted(true)
    setTimeout(() => setVoted(false), 300)
  }

  return (
    <article className="flex gap-3 rounded-xl border border-edge bg-surface p-4 transition-all hover:border-cyan/40 hover:shadow-glow animate-fade-in">
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={vote}
          title="Votar"
          className={`rounded-lg border border-edge bg-raised p-1.5 text-muted transition-all hover:border-cyan/50 hover:text-cyan ${
            voted ? 'scale-125 border-cyan/60 text-cyan' : ''
          }`}
        >
          <ChevronUp size={16} />
        </button>
        <span className="font-mono text-sm font-medium text-ink">{idea.votes || 0}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2">
          <span className="eyebrow text-[10px]">{category.eyebrow}</span>
          {(() => {
            const project = idea.projectId ? projects.find((p) => p.id === idea.projectId) : null
            return project ? (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted">
                <span className={`h-1.5 w-1.5 rounded-full ${projectColor(project.color).dot}`} />
                {project.name}
              </span>
            ) : null
          })()}
        </div>
        <h3 className="mt-0.5 font-display text-sm font-semibold leading-snug text-ink">{idea.title}</h3>
        {idea.description && <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted">{idea.description}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <select
            value={idea.status}
            onChange={(e) => updateIdea(idea.id, { status: e.target.value }, { silent: true })}
            title="Cambiar estado"
            className={`cursor-pointer appearance-none rounded-md border px-1.5 py-0.5 text-[11px] font-medium focus:outline-none ${status.badge}`}
          >
            {IDEA_STATUS_ORDER.map((s) => (
              <option key={s} value={s} className="bg-surface text-ink">
                {IDEA_STATUSES[s].label}
              </option>
            ))}
          </select>

          {idea.status === 'aprobada' &&
            (idea.convertedTaskId ? (
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-emerald-400">
                <CheckCircle2 size={11} /> En Backlog
              </span>
            ) : (
              <button
                onClick={() => convertIdea(idea)}
                className="inline-flex items-center gap-1 rounded-md border border-cyan/40 bg-cyan/10 px-1.5 py-0.5 text-[11px] font-medium text-cyan transition-colors hover:bg-cyan/20"
              >
                <Send size={11} /> Convertir en tarea
              </button>
            ))}

          <span className="ml-auto flex gap-0.5">
            <button
              onClick={() => openIdeaModal(idea)}
              title="Editar"
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-raised hover:text-ink"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              title="Eliminar"
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 size={13} />
            </button>
          </span>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar idea"
          message={`“${idea.title}” se eliminará de forma permanente.`}
          onConfirm={() => deleteIdea(idea.id)}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </article>
  )
}
