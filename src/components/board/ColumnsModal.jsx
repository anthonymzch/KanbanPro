import { useState } from 'react'
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import { COLUMNS, PROJECT_COLORS, PROJECT_COLOR_ORDER, projectColor } from '../../lib/constants'
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

function ColumnForm({ initial, saveLabel = 'Crear columna', onSave, onCancel }) {
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

export default function ColumnsModal() {
  const { tasks, customColumns, prefs, setHiddenColumns, addColumn, updateColumn, deleteColumn } = useStore()
  const { closeColumns } = useUI()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const hidden = prefs.hiddenColumns || []
  const taskCount = (id) => tasks.filter((t) => t.column === id).length

  const toggleHidden = (id) => {
    setHiddenColumns(hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id])
  }

  return (
    <Modal onClose={closeColumns} eyebrow="<tablero />" title="Columnas">
      <p className="mb-4 text-xs text-muted">
        Oculta las columnas que no uses o crea nuevas para adaptar el tablero a tu flujo. Las tareas de una columna
        oculta no se pierden: solo dejan de mostrarse hasta que la vuelvas a activar.
      </p>

      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">Columnas del sistema</p>
      <div className="mb-4 space-y-1">
        {COLUMNS.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-raised">
            <span className={`flex-1 truncate text-sm ${hidden.includes(c.id) ? 'text-faint' : 'text-ink'}`}>
              {c.label}
            </span>
            <span className="font-mono text-[10px] text-faint">{taskCount(c.id)}</span>
            <button
              onClick={() => toggleHidden(c.id)}
              title={hidden.includes(c.id) ? 'Mostrar columna' : 'Ocultar columna'}
              className="rounded-md p-1.5 text-faint transition-colors hover:bg-surface hover:text-ink"
            >
              {hidden.includes(c.id) ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        ))}
      </div>

      {customColumns.length > 0 && (
        <>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-faint">Columnas personalizadas</p>
          <div className="mb-4 space-y-1">
            {customColumns.map((c) =>
              editingId === c.id ? (
                <div key={c.id} className="rounded-lg border border-edge bg-raised p-3">
                  <ColumnForm
                    initial={c}
                    saveLabel="Guardar"
                    onCancel={() => setEditingId(null)}
                    onSave={(data) => {
                      updateColumn(c.id, data)
                      setEditingId(null)
                    }}
                  />
                </div>
              ) : (
                <div key={c.id} className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-raised">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${projectColor(c.color).dot}`} />
                  <span className={`flex-1 truncate text-sm ${hidden.includes(c.id) ? 'text-faint' : 'text-ink'}`}>
                    {c.label}
                  </span>
                  <span className="font-mono text-[10px] text-faint">{taskCount(c.id)}</span>
                  <button
                    onClick={() => toggleHidden(c.id)}
                    title={hidden.includes(c.id) ? 'Mostrar columna' : 'Ocultar columna'}
                    className="rounded-md p-1.5 text-faint opacity-0 transition-all hover:bg-surface hover:text-ink group-hover:opacity-100"
                  >
                    {hidden.includes(c.id) ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={() => setEditingId(c.id)}
                    title="Renombrar"
                    className="rounded-md p-1.5 text-faint opacity-0 transition-all hover:bg-surface hover:text-ink group-hover:opacity-100"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    title="Eliminar"
                    className="rounded-md p-1.5 text-faint opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ),
            )}
          </div>
        </>
      )}

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
