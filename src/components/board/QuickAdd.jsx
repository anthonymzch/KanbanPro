import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import { projectColor, projectStatus } from '../../lib/constants'

export default function QuickAdd({ column }) {
  const { addTask, projects } = useStore()
  const { filters } = useUI()
  const [value, setValue] = useState('')
  // Título pendiente de elegir proyecto cuando hay 2+ proyectos filtrados
  const [pendingTitle, setPendingTitle] = useState(null)
  // Dentro de esa pregunta: "Otro" muestra los proyectos que no están en el filtro
  const [pickingOther, setPickingOther] = useState(false)
  // Clic directo en el "+": elegir proyecto antes de escribir el título
  const [pickingProject, setPickingProject] = useState(false)
  // undefined = sin elegir explícitamente (se usa el filtro activo); null = "sin proyecto" elegido a propósito
  const [chosenProjectId, setChosenProjectId] = useState(undefined)

  const activeProjects = projects.filter((p) => projectStatus(p) === 'active')
  const filteredProjects = filters.projects.map((id) => projects.find((p) => p.id === id)).filter(Boolean)
  const otherProjects = activeProjects.filter((p) => !filters.projects.includes(p.id))
  const chosenProject = chosenProjectId ? activeProjects.find((p) => p.id === chosenProjectId) : null

  const reset = () => {
    setValue('')
    setChosenProjectId(undefined)
  }

  const create = (projectId) => {
    addTask({ title: pendingTitle, column, projectId })
    setPendingTitle(null)
    setPickingOther(false)
    reset()
  }

  const submit = (e) => {
    e.preventDefault()
    const title = value.trim()
    if (!title) return
    if (chosenProjectId !== undefined) {
      addTask({ title, column, projectId: chosenProjectId })
      reset()
      return
    }
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
    const chip =
      'flex items-center gap-1.5 rounded-md border border-edge bg-raised px-2 py-1 text-[11px] text-ink transition-colors hover:border-cyan/40'
    const options = pickingOther ? otherProjects : filteredProjects
    return (
      <div className="p-2 pt-1">
        <p className="mb-1.5 truncate px-1 text-xs text-muted">
          <span className="font-medium text-ink">{pendingTitle}</span> —{' '}
          {pickingOther ? 'elige otro proyecto' : '¿en qué proyecto?'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {options.map((p) => (
            <button key={p.id} type="button" onClick={() => create(p.id)} className={chip}>
              <span className={`h-1.5 w-1.5 rounded-full ${projectColor(p.color).dot}`} />
              {p.name}
            </button>
          ))}
          {pickingOther ? (
            <>
              <button type="button" onClick={() => create(null)} className={`${chip} text-faint`}>
                Sin proyecto
              </button>
              <button
                type="button"
                onClick={() => setPickingOther(false)}
                className="rounded-md px-2 py-1 text-[11px] text-faint hover:text-ink"
              >
                Atrás
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setPickingOther(true)} className={`${chip} border-dashed text-faint`}>
                Otro…
              </button>
              <button
                type="button"
                onClick={() => setPendingTitle(null)}
                className="rounded-md px-2 py-1 text-[11px] text-faint hover:text-ink"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (pickingProject) {
    return (
      <div className="p-2 pt-1">
        <p className="mb-1.5 px-1 text-xs text-muted">¿En qué proyecto va la tarea nueva?</p>
        <div className="flex flex-wrap gap-1.5">
          {activeProjects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setChosenProjectId(p.id)
                setPickingProject(false)
              }}
              className="flex items-center gap-1.5 rounded-md border border-edge bg-raised px-2 py-1 text-[11px] text-ink transition-colors hover:border-cyan/40"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${projectColor(p.color).dot}`} />
              {p.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setChosenProjectId(null)
              setPickingProject(false)
            }}
            className="rounded-md border border-edge bg-raised px-2 py-1 text-[11px] text-faint transition-colors hover:border-cyan/40"
          >
            Sin proyecto
          </button>
          <button
            type="button"
            onClick={() => setPickingProject(false)}
            className="rounded-md px-2 py-1 text-[11px] text-faint hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 pt-1">
      {chosenProjectId !== undefined && (
        <div className="mb-1.5 flex items-center gap-1.5 px-1">
          <span className="inline-flex items-center gap-1 rounded-md border border-edge bg-raised px-1.5 py-0.5 text-[11px] text-ink">
            {chosenProject ? (
              <>
                <span className={`h-1.5 w-1.5 rounded-full ${projectColor(chosenProject.color).dot}`} />
                {chosenProject.name}
              </>
            ) : (
              'Sin proyecto'
            )}
          </span>
          <button
            type="button"
            onClick={() => setChosenProjectId(undefined)}
            title="Quitar proyecto elegido"
            className="text-faint transition-colors hover:text-ink"
          >
            <X size={11} />
          </button>
        </div>
      )}
      <form onSubmit={submit} className="relative">
        <button
          type="button"
          onClick={() => setPickingProject(true)}
          title="Elegir proyecto para la tarea nueva"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint transition-colors hover:text-cyan"
        >
          <Plus size={13} />
        </button>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Añadir tarea"
          className="w-full rounded-lg border border-dashed border-edge bg-transparent py-2 pl-8 pr-3 text-xs text-ink placeholder:text-faint transition-colors focus:border-solid focus:border-cyan/40 focus:bg-raised focus:outline-none"
        />
      </form>
    </div>
  )
}
