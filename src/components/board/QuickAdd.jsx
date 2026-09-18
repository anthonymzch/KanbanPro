import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import { projectColor } from '../../lib/constants'

export default function QuickAdd({ column }) {
  const { addTask, projects } = useStore()
  const { filters } = useUI()
  const [value, setValue] = useState('')
  // Título pendiente de elegir proyecto cuando hay 2+ proyectos filtrados
  const [pendingTitle, setPendingTitle] = useState(null)

  const filteredProjects = filters.projects.map((id) => projects.find((p) => p.id === id)).filter(Boolean)

  const create = (projectId) => {
    addTask({ title: pendingTitle, column, projectId })
    setPendingTitle(null)
    setValue('')
  }

  const submit = (e) => {
    e.preventDefault()
    const title = value.trim()
    if (!title) return
    if (filteredProjects.length > 1) {
      setPendingTitle(title)
      return
    }
    // Con un único proyecto filtrado, la tarea rápida nace en ese proyecto
    const soleProject = filteredProjects.length === 1 ? filteredProjects[0].id : null
    addTask({ title, column, projectId: soleProject })
    setValue('')
  }

  if (pendingTitle) {
    return (
      <div className="p-2 pt-1">
        <p className="mb-1.5 truncate px-1 text-xs text-muted">
          <span className="font-medium text-ink">{pendingTitle}</span> — ¿en qué proyecto?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {filteredProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => create(p.id)}
              className="flex items-center gap-1.5 rounded-md border border-edge bg-raised px-2 py-1 text-[11px] text-ink transition-colors hover:border-cyan/40"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${projectColor(p.color).dot}`} />
              {p.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPendingTitle(null)}
            className="rounded-md px-2 py-1 text-[11px] text-faint hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="relative p-2 pt-1">
      <Plus size={13} className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 text-faint" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Añadir tarea"
        className="w-full rounded-lg border border-dashed border-edge bg-transparent py-2 pl-8 pr-3 text-xs text-ink placeholder:text-faint transition-colors focus:border-solid focus:border-cyan/40 focus:bg-raised focus:outline-none"
      />
    </form>
  )
}
