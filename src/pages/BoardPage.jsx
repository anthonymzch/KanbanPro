import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  closestCenter,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { celebrate } from '../lib/celebrate'
import Column from '../components/board/Column'
import { CardBody } from '../components/board/TaskCard'
import { useStore } from '../hooks/useStore'
import { useToast } from '../hooks/useToast'
import { useUI } from '../hooks/useUI'

// Las columnas son ordenables con id "col:<id>" para no chocar con el droppable de tareas
const isColumnId = (id) => typeof id === 'string' && id.startsWith('col:')

function buildColumns(tasks, columnIds) {
  const map = Object.fromEntries(columnIds.map((c) => [c, []]))
  for (const t of tasks) (map[t.column] || map.backlog).push(t.id)
  return map
}

export default function BoardPage() {
  const { tasks, moveTask, columns, prefs, setColumnOrder } = useStore()
  const { filters, openTaskModal } = useUI()
  const toast = useToast()

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns])
  const visibleColumns = useMemo(
    () => columns.filter((c) => !(prefs.hiddenColumns || []).includes(c.id)),
    [columns, prefs.hiddenColumns],
  )

  // tasks ya viene ordenado por `order` desde Firestore
  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return tasks.filter(
      (t) =>
        (!q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)) &&
        (!filters.priority || t.priority === filters.priority) &&
        (!filters.tag || (t.tags || []).includes(filters.tag)) &&
        (!filters.projects.length || filters.projects.includes(t.projectId)),
    )
  }, [tasks, filters])

  const byId = useMemo(() => Object.fromEntries(tasks.map((t) => [t.id, t])), [tasks])

  // cols: { columnId: [taskId] } — copia local para el drag optimista
  const [cols, setCols] = useState(() => buildColumns(visible, columnIds))
  const [activeId, setActiveId] = useState(null)
  const dragging = useRef(false)

  const rebuild = useCallback(() => setCols(buildColumns(visible, columnIds)), [visible, columnIds])

  useEffect(() => {
    if (!dragging.current) rebuild()
  }, [rebuild])

  const findCol = useCallback(
    (id) => (columnIds.includes(id) ? id : columnIds.find((c) => cols[c]?.includes(id))),
    [cols, columnIds],
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  // La tarjeta activa se excluye de los candidatos (su propio droppable
  // "gana" a las columnas vacías con closestCorners). Prioridad al puntero
  // y fallback a esquinas para huecos/bordes.
  const collisionDetection = useCallback((args) => {
    // Arrastrar una columna: solo compite contra las demás columnas
    if (isColumnId(args.active.id)) {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => isColumnId(c.id)),
      })
    }
    const candidates = {
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => c.id !== args.active.id && !isColumnId(c.id)),
    }
    const withPointer = pointerWithin(candidates)
    return withPointer.length ? withPointer : closestCorners(candidates)
  }, [])

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

    if (isColumnId(active.id)) {
      if (!over || active.id === over.id) return
      const shown = visibleColumns.map((c) => c.id)
      const moved = arrayMove(shown, shown.indexOf(active.id.slice(4)), shown.indexOf(over.id.slice(4)))
      // Las columnas ocultas conservan su hueco; solo se reordenan las visibles entre sí
      let k = 0
      setColumnOrder(columnIds.map((id) => (shown.includes(id) ? moved[k++] : id)))
      return
    }

    const col = findCol(active.id)
    if (!over || !col) {
      rebuild()
      return
    }

    let ids = [...(cols[col] || [])]
    if (over.id !== active.id && !columnIds.includes(over.id) && findCol(over.id) === col) {
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
      celebrate()
      toast('Tarea completada 🎉')
    } else if (task.column !== col) {
      toast(`Movida a ${columns.find((c) => c.id === col)?.label || col}`, 'info')
    }
  }

  const activeTask = activeId ? byId[activeId] : null

  // Arrastrar el fondo del tablero para desplazarse (solo ratón; en táctil ya hay scroll nativo)
  const boardRef = useRef(null)
  const pan = useRef(null)
  const [panning, setPanning] = useState(false)

  const onPanStart = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    if (e.target.closest('[role="button"], button, input, textarea, select, a, label')) return
    // Las capas invisibles que cierran los popovers deben recibir su propio clic
    if (getComputedStyle(e.target).position === 'fixed') return
    const list = e.target.closest('[data-col-scroll]')
    pan.current = {
      x: e.clientX,
      y: e.clientY,
      left: boardRef.current.scrollLeft,
      top: list ? list.scrollTop : 0,
      list,
    }
    boardRef.current.setPointerCapture(e.pointerId)
    setPanning(true)
  }
  const onPanMove = (e) => {
    const p = pan.current
    if (!p) return
    boardRef.current.scrollLeft = p.left - (e.clientX - p.x)
    if (p.list) p.list.scrollTop = p.top - (e.clientY - p.y)
    window.getSelection()?.removeAllRanges()
  }
  const onPanEnd = (e) => {
    if (!pan.current) return
    pan.current = null
    setPanning(false)
    boardRef.current?.releasePointerCapture?.(e.pointerId)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div
        ref={boardRef}
        onPointerDown={onPanStart}
        onPointerMove={onPanMove}
        onPointerUp={onPanEnd}
        onPointerCancel={onPanEnd}
        className={`board-scroll flex h-full gap-4 overflow-x-auto overflow-y-hidden p-4 md:p-6 ${
          panning ? 'cursor-grabbing select-none' : 'cursor-grab'
        }`}
      >
        <SortableContext items={visibleColumns.map((c) => `col:${c.id}`)} strategy={horizontalListSortingStrategy}>
          {visibleColumns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={(cols[column.id] || []).map((id) => byId[id]).filter(Boolean)}
              onCardClick={openTaskModal}
            />
          ))}
        </SortableContext>
      </div>
      <DragOverlay>{activeTask ? <CardBody task={activeTask} overlay /> : null}</DragOverlay>
    </DndContext>
  )
}
