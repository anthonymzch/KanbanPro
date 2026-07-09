import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import confetti from 'canvas-confetti'
import Column from '../components/board/Column'
import { CardBody } from '../components/board/TaskCard'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { useUI } from '../hooks/useUI'
import { COLUMNS, COLUMN_IDS } from '../lib/constants'

function buildColumns(tasks) {
  const map = Object.fromEntries(COLUMN_IDS.map((c) => [c, []]))
  for (const t of tasks) (map[t.column] || map.backlog).push(t.id)
  return map
}

export default function BoardPage() {
  const { tasks, moveTask } = useStore()
  const { filters, openTaskModal } = useUI()
  const toast = useToast()

  // tasks ya viene ordenado por `order` desde Firestore
  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return tasks.filter(
      (t) =>
        (!q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)) &&
        (!filters.priority || t.priority === filters.priority) &&
        (!filters.tag || (t.tags || []).includes(filters.tag)),
    )
  }, [tasks, filters])

  const byId = useMemo(() => Object.fromEntries(tasks.map((t) => [t.id, t])), [tasks])

  // cols: { columnId: [taskId] } — copia local para el drag optimista
  const [cols, setCols] = useState(() => buildColumns(visible))
  const [activeId, setActiveId] = useState(null)
  const dragging = useRef(false)

  const rebuild = useCallback(() => setCols(buildColumns(visible)), [visible])

  useEffect(() => {
    if (!dragging.current) rebuild()
  }, [rebuild])

  const findCol = useCallback(
    (id) => (COLUMN_IDS.includes(id) ? id : COLUMN_IDS.find((c) => cols[c]?.includes(id))),
    [cols],
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragStart = ({ active }) => {
    dragging.current = true
    setActiveId(active.id)
  }

  // Mover la tarjeta de contenedor mientras se arrastra (necesario para
  // que dnd-kit anime la inserción entre columnas)
  const onDragOver = ({ active, over }) => {
    if (!over) return
    const from = findCol(active.id)
    const to = findCol(over.id)
    if (!from || !to || from === to) return
    setCols((prev) => {
      const fromIds = prev[from].filter((id) => id !== active.id)
      const toIds = prev[to].filter((id) => id !== active.id)
      let idx = toIds.indexOf(over.id)
      if (idx === -1) idx = toIds.length
      toIds.splice(idx, 0, active.id)
      return { ...prev, [from]: fromIds, [to]: toIds }
    })
  }

  const onDragCancel = () => {
    dragging.current = false
    setActiveId(null)
    rebuild()
  }

  const onDragEnd = ({ active, over }) => {
    dragging.current = false
    setActiveId(null)
    const col = findCol(active.id)
    if (!over || !col) {
      rebuild()
      return
    }

    let ids = [...(cols[col] || [])]
    if (over.id !== active.id && !COLUMN_IDS.includes(over.id) && findCol(over.id) === col) {
      ids = arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id))
      setCols((prev) => ({ ...prev, [col]: ids }))
    }

    const task = byId[active.id]
    if (!task) return

    // Orden fraccionario: solo se escribe el documento arrastrado
    const i = ids.indexOf(active.id)
    const prevOrder = byId[ids[i - 1]]?.order
    const nextOrder = byId[ids[i + 1]]?.order
    let order
    if (prevOrder != null && nextOrder != null) order = (prevOrder + nextOrder) / 2
    else if (prevOrder != null) order = prevOrder + 1000
    else if (nextOrder != null) order = nextOrder - 1000
    else order = 1000

    const unchanged =
      task.column === col &&
      (prevOrder == null || prevOrder < task.order) &&
      (nextOrder == null || task.order < nextOrder)
    if (unchanged) return

    moveTask(active.id, col, order)

    if (col === 'done' && task.column !== 'done') {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#2563EB', '#22D3EE', '#8B5CF6'],
      })
      toast('Tarea completada 🎉')
    } else if (task.column !== col) {
      toast(`Movida a ${COLUMNS.find((c) => c.id === col).label}`, 'info')
    }
  }

  const activeTask = activeId ? byId[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="board-scroll flex h-full gap-4 overflow-x-auto overflow-y-hidden p-4 md:p-6">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={(cols[column.id] || []).map((id) => byId[id]).filter(Boolean)}
            onCardClick={openTaskModal}
          />
        ))}
      </div>
      <DragOverlay>{activeTask ? <CardBody task={activeTask} overlay /> : null}</DragOverlay>
    </DndContext>
  )
}
