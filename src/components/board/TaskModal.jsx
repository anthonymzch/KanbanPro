import { useMemo, useState } from 'react'
import { Archive, Plus, Trash2, X } from 'lucide-react'
import Modal from '../ui/Modal'
import Badge from '../ui/Badge'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import { COLUMNS, PRIORITIES, PRIORITY_ORDER, tagColor } from '../../lib/constants'
import { btnGhost, btnPrimary, inputCls, selectCls } from '../../lib/ui'

export default function TaskModal() {
  const { addTask, updateTask, deleteTask, projects, tasks } = useStore()
  const { taskModal, closeTaskModal, filters, openProjects } = useUI()
  const task = taskModal.task
  const isNew = !task

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [column, setColumn] = useState(task?.column || taskModal.column || 'backlog')
  const [priority, setPriority] = useState(task?.priority || 'media')
  const [dueDate, setDueDate] = useState(task?.dueDate || '')
  // Al crear con un único proyecto filtrado, la tarea nace en ese proyecto
  const soleFilteredProject = filters.projects.length === 1 ? filters.projects[0] : ''
  const [projectId, setProjectId] = useState(task?.projectId || (isNew ? soleFilteredProject : '') || '')
  const [tags, setTags] = useState(task?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestOpen, setTagSuggestOpen] = useState(false)
  const [subtasks, setSubtasks] = useState(task?.subtasks || [])
  const [subtaskInput, setSubtaskInput] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const existingTags = useMemo(() => [...new Set(tasks.flatMap((t) => t.tags || []))].sort(), [tasks])
  const tagSuggestions = useMemo(() => {
    const q = tagInput.trim().toLowerCase()
    return existingTags.filter((t) => !tags.includes(t) && (!q || t.includes(q)))
  }, [existingTags, tags, tagInput])

  const addTag = (raw) => {
    const t = raw.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const addSubtask = (raw) => {
    const t = raw.trim()
    if (!t) return
    setSubtasks((prev) => [...prev, { id: crypto.randomUUID(), title: t, done: false }])
    setSubtaskInput('')
  }
  const toggleSubtask = (id) => setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)))
  const removeSubtask = (id) => setSubtasks((prev) => prev.filter((s) => s.id !== id))

  const submit = (e) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    const finalTags = tagInput.trim() ? [...tags, tagInput.trim().toLowerCase()].filter((v, i, a) => a.indexOf(v) === i) : tags
    const finalSubtasks = subtaskInput.trim()
      ? [...subtasks, { id: crypto.randomUUID(), title: subtaskInput.trim(), done: false }]
      : subtasks
    const data = {
      title: t,
      description: description.trim(),
      column,
      priority,
      dueDate: dueDate || null,
      tags: finalTags,
      subtasks: finalSubtasks,
      projectId: projectId || null,
    }
    if (isNew) addTask(data)
    else updateTask(task.id, data)
    closeTaskModal()
  }

  return (
    <>
      <Modal onClose={closeTaskModal} eyebrow="<tarea />" title={isNew ? 'Nueva tarea' : 'Editar tarea'} wide>
        <form onSubmit={submit} className="space-y-4">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la tarea"
            className={inputCls}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={5}
            className={`${inputCls} resize-y`}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-mono text-[11px] text-faint">proyecto</span>
              <div className="flex items-center gap-1.5">
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={`${selectCls} w-full`}>
                  <option value="">Sin proyecto</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={openProjects}
                  title="Gestionar proyectos"
                  className="shrink-0 rounded-lg border border-dashed border-edge px-2.5 py-2 text-sm text-faint transition-colors hover:border-cyan/40 hover:text-ink"
                >
                  +
                </button>
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[11px] text-faint">columna</span>
              <select value={column} onChange={(e) => setColumn(e.target.value)} className={`${selectCls} w-full`}>
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[11px] text-faint">prioridad</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={`${selectCls} w-full`}>
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITIES[p].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[11px] text-faint">fecha límite</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </label>
          </div>
          <div className="relative">
            <span className="mb-1 block font-mono text-[11px] text-faint">etiquetas</span>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-edge bg-raised p-2">
              {tags.map((tag) => (
                <Badge key={tag} className={tagColor(tag)}>
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="opacity-60 hover:opacity-100">
                    <X size={10} />
                  </button>
                </Badge>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onFocus={() => setTagSuggestOpen(true)}
                onBlur={() => setTimeout(() => setTagSuggestOpen(false), 120)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTag(tagInput)
                  } else if (e.key === 'Backspace' && !tagInput && tags.length) {
                    setTags(tags.slice(0, -1))
                  }
                }}
                placeholder={tags.length ? '' : 'Escribe y pulsa Enter'}
                className="min-w-[120px] flex-1 bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
              />
            </div>
            {tagSuggestOpen && tagSuggestions.length > 0 && (
              <div className="absolute left-0 top-[calc(100%+4px)] z-10 max-h-40 w-full overflow-y-auto rounded-lg border border-edge bg-surface p-1 shadow-card">
                {tagSuggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addTag(t)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-ink transition-colors hover:bg-raised"
                  >
                    <Badge className={tagColor(t)}>{t}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <span className="mb-1 block font-mono text-[11px] text-faint">subtareas</span>
            <div className="space-y-1 rounded-lg border border-edge bg-raised p-2">
              {subtasks.map((s) => (
                <div key={s.id} className="group flex items-center gap-2 rounded-md px-1 py-1">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => toggleSubtask(s.id)}
                    className="h-3.5 w-3.5 shrink-0 accent-cyan"
                  />
                  <span className={`flex-1 text-sm ${s.done ? 'text-faint line-through' : 'text-ink'}`}>{s.title}</span>
                  <button
                    type="button"
                    onClick={() => removeSubtask(s.id)}
                    className="shrink-0 text-faint opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-1.5 px-1">
                <Plus size={13} className="shrink-0 text-faint" />
                <input
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSubtask(subtaskInput)
                    }
                  }}
                  placeholder="Añadir subtarea y pulsar Enter"
                  className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-ink placeholder:text-faint focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {!isNew && (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 size={14} /> Eliminar
                </button>
                {column !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => {
                      updateTask(task.id, { column: 'archived' }, { silent: true })
                      closeTaskModal()
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-raised hover:text-ink"
                  >
                    <Archive size={14} /> Archivar
                  </button>
                )}
              </>
            )}
            <div className="ml-auto flex gap-2">
              <button type="button" className={btnGhost} onClick={closeTaskModal}>
                Cancelar
              </button>
              <button type="submit" className={btnPrimary} disabled={!title.trim()}>
                {isNew ? 'Crear tarea' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar tarea"
          message={`“${task.title}” se eliminará de forma permanente. Esta acción no se puede deshacer.`}
          onConfirm={() => {
            deleteTask(task.id)
            closeTaskModal()
          }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}
