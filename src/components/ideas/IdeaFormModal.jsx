import { useState } from 'react'
import Modal from '../ui/Modal'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import { IDEA_CATEGORIES, IDEA_STATUSES, IDEA_STATUS_ORDER } from '../../lib/constants'
import { btnGhost, btnPrimary, inputCls, selectCls } from '../../lib/ui'

export default function IdeaFormModal() {
  const { addIdea, updateIdea, projects } = useStore()
  const { ideaModal, closeIdeaModal } = useUI()
  const idea = ideaModal.idea
  const isNew = !idea

  const [title, setTitle] = useState(idea?.title || '')
  const [description, setDescription] = useState(idea?.description || '')
  const [category, setCategory] = useState(idea?.category || 'nueva-app')
  const [status, setStatus] = useState(idea?.status || 'nueva')
  const [projectId, setProjectId] = useState(idea?.projectId || '')

  const submit = (e) => {
    e.preventDefault()
    const t = title.trim()
    if (!t) return
    const data = { title: t, description: description.trim(), category, projectId: projectId || null }
    if (isNew) addIdea(data)
    else updateIdea(idea.id, { ...data, status })
    closeIdeaModal()
  }

  return (
    <Modal onClose={closeIdeaModal} eyebrow="<idea />" title={isNew ? 'Nueva idea' : 'Editar idea'}>
      <form onSubmit={submit} className="space-y-4">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué se te ocurrió?"
          className={inputCls}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Cuéntala con más detalle (opcional)"
          rows={4}
          className={`${inputCls} resize-y`}
        />
        <div>
          <span className="mb-1.5 block font-mono text-[11px] text-faint">categoría</span>
          <div className="flex gap-2">
            {Object.entries(IDEA_CATEGORIES).map(([id, cat]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  category === id
                    ? 'border-cyan/50 bg-cyan/10 text-cyan shadow-glow'
                    : 'border-edge bg-raised text-muted hover:text-ink'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-1 block font-mono text-[11px] text-faint">proyecto (opcional)</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={`${selectCls} w-full`}>
            <option value="">Sin proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        {!isNew && (
          <label className="block">
            <span className="mb-1 block font-mono text-[11px] text-faint">estado</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${selectCls} w-full`}>
              {IDEA_STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {IDEA_STATUSES[s].label}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={btnGhost} onClick={closeIdeaModal}>
            Cancelar
          </button>
          <button type="submit" className={btnPrimary} disabled={!title.trim()}>
            {isNew ? 'Guardar idea' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
