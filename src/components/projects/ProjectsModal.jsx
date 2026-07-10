import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import { PROJECT_COLORS, PROJECT_COLOR_ORDER, projectColor } from '../../lib/constants'
import { btnGhost, btnPrimary, inputCls } from '../../lib/ui'

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROJECT_COLOR_ORDER.map((key) => (
        <button
          key={key}
          type="button"
          title={PROJECT_COLORS[key].label}
          onClick={() => onChange(key)}
          className={`h-6 w-6 rounded-full transition ${PROJECT_COLORS[key].dot} ${
            value === key ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : 'opacity-50 hover:opacity-100'
          }`}
        />
      ))}
    </div>
  )
}

function ProjectForm({ initial, saveLabel, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [color, setColor] = useState(initial?.color || 'blue')

  const submit = (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    onSave({ name: n, color })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del proyecto"
        className={inputCls}
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex justify-end gap-2">
        <button type="button" className={btnGhost} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={btnPrimary} disabled={!name.trim()}>
          {saveLabel}
        </button>
      </div>
    </form>
  )
}

export default function ProjectsModal() {
  const { projects, tasks, addProject, updateProject, deleteProject } = useStore()
  const { closeProjects } = useUI()
  const [editingId, setEditingId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const taskCount = (id) => tasks.filter((t) => t.projectId === id).length

  return (
    <Modal onClose={closeProjects} eyebrow="<proyectos />" title="Proyectos">
      <p className="mb-4 text-xs text-muted">
        Agrupa tus tarjetas por proyecto: cada uno tiene su color y puedes filtrar el tablero con un clic.
      </p>
      <div className="space-y-1">
        {projects.map((p) =>
          editingId === p.id ? (
            <div key={p.id} className="rounded-lg border border-edge bg-raised p-3">
              <ProjectForm
                initial={p}
                saveLabel="Guardar"
                onCancel={() => setEditingId(null)}
                onSave={(data) => {
                  updateProject(p.id, data)
                  setEditingId(null)
                }}
              />
            </div>
          ) : (
            <div key={p.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-raised">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${projectColor(p.color).dot}`} />
              <span className="flex-1 truncate text-sm text-ink">{p.name}</span>
              <span className="font-mono text-[10px] text-faint">
                {taskCount(p.id)} {taskCount(p.id) === 1 ? 'tarea' : 'tareas'}
              </span>
              <button
                onClick={() => setEditingId(p.id)}
                title="Editar"
                className="rounded-md p-1.5 text-faint opacity-0 transition-all hover:bg-surface hover:text-ink group-hover:opacity-100"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => setConfirmDelete(p)}
                title="Eliminar"
                className="rounded-md p-1.5 text-faint opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ),
        )}
        {projects.length === 0 && !adding && (
          <p className="rounded-lg border border-dashed border-edge px-3 py-6 text-center text-xs text-faint">
            Aún no tienes proyectos. Crea el primero 👇
          </p>
        )}
      </div>

      {adding ? (
        <div className="mt-3 rounded-lg border border-edge bg-raised p-3">
          <ProjectForm
            saveLabel="Crear proyecto"
            onCancel={() => setAdding(false)}
            onSave={(data) => {
              addProject(data)
              setAdding(false)
            }}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-3 w-full rounded-lg border border-dashed border-edge py-2 text-sm text-muted transition-colors hover:border-cyan/40 hover:text-ink"
        >
          + Nuevo proyecto
        </button>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar proyecto"
          message={`“${confirmDelete.name}” se eliminará. Sus tareas e ideas no se borran: quedan sin proyecto.`}
          onConfirm={() => deleteProject(confirmDelete.id)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </Modal>
  )
}
