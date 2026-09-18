import { useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Eye, EyeOff, GripVertical, Pencil, Trash2 } from 'lucide-react'
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

export function ColumnForm({ initial, saveLabel = 'Crear columna', onSave, onCancel }) {
  const [label, setLabel] = useState(initial?.label || '')
  const [color, setColor] = useState(initial?.color || 'violet')

  const submit = (e) => {
    e.preventDefault()
    const l = label.trim()
    if (!l) return
    onSave({ label: l, color })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nombre de la columna"
        className={inputCls}
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex justify-end gap-2">
        <button type="button" className={btnGhost} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={btnPrimary} disabled={!label.trim()}>
          {saveLabel}
        </button>
      </div>
    </form>
  )
}

function SortableColumnRow({ column, hidden, count, editing, onToggleHidden, onEdit, onDelete, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      className={isDragging ? 'relative opacity-80' : ''}
    >
      {editing ? (
        <div className="rounded-lg border border-edge bg-raised p-3">{children}</div>
      ) : (
        <div className="group flex items-center gap-2 rounded-lg px-1 py-2 transition-colors hover:bg-raised">
          <button
            type="button"
            title="Arrastra para cambiar el orden"
            className="cursor-grab touch-none rounded-md p-1 text-faint transition-colors hover:text-ink active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </button>
          {column.custom && <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${projectColor(column.color).dot}`} />}
          <span className={`flex-1 truncate text-sm ${hidden ? 'text-faint' : 'text-ink'}`}>{column.label}</span>
          {!column.custom && <span className="font-mono text-[10px] text-faint">sistema</span>}
          <span className="font-mono text-[10px] text-faint">{count}</span>
          <button
            onClick={onToggleHidden}
            title={hidden ? 'Mostrar columna' : 'Ocultar columna'}
            className="rounded-md p-1.5 text-faint transition-colors hover:bg-surface hover:text-ink"
          >
            {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          {column.custom && (
            <>
              <button
                onClick={onEdit}
                title="Renombrar"
                className="rounded-md p-1.5 text-faint opacity-0 transition-all hover:bg-surface hover:text-ink group-hover:opacity-100"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={onDelete}
                title="Eliminar"
                className="rounded-md p-1.5 text-faint opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function ColumnsModal() {
  const { tasks, columns, prefs, setHiddenColumns, setColumnOrder, addColumn, updateColumn, deleteColumn } = useStore()
  const { closeColumns } = useUI()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const hidden = prefs.hiddenColumns || []
  const ids = columns.map((c) => c.id)
  const taskCount = (id) => tasks.filter((t) => t.column === id).length

  const toggleHidden = (id) => {
    setHiddenColumns(hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id])
  }

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setColumnOrder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)))
  }

  return (
    <Modal onClose={closeColumns} eyebrow="<tablero />" title="Columnas">
      <p className="mb-4 text-xs text-muted">
        Arrastra <GripVertical size={11} className="inline align-text-bottom" /> para cambiar el orden — también puedes
        poner tus columnas nuevas entre las del sistema. Oculta las que no uses: sus tareas no se pierden, solo dejan de
        mostrarse hasta que la vuelvas a activar.
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="mb-4 space-y-1">
            {columns.map((c) => (
              <SortableColumnRow
                key={c.id}
                column={c}
                hidden={hidden.includes(c.id)}
                count={taskCount(c.id)}
                editing={editingId === c.id}
                onToggleHidden={() => toggleHidden(c.id)}
                onEdit={() => setEditingId(c.id)}
                onDelete={() => setConfirmDelete(c)}
              >
                <ColumnForm
                  initial={c}
                  saveLabel="Guardar"
                  onCancel={() => setEditingId(null)}
                  onSave={(data) => {
                    updateColumn(c.id, data)
                    setEditingId(null)
                  }}
                />
              </SortableColumnRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {adding ? (
        <div className="rounded-lg border border-edge bg-raised p-3">
          <ColumnForm
            onSave={(data) => {
              addColumn(data)
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-lg border border-dashed border-edge py-2 text-sm text-muted transition-colors hover:border-cyan/40 hover:text-ink"
        >
          + Nueva columna
        </button>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Eliminar columna"
          message={`“${confirmDelete.label}” se eliminará. Sus tareas volverán al Backlog.`}
          onConfirm={() => deleteColumn(confirmDelete.id)}
          onClose={() => setConfirmDelete(null)}
        />
      )}
    </Modal>
  )
}
