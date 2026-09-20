import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, Lightbulb, LogOut, PanelLeftClose, Plus, Settings2, SquareKanban } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import { projectColor, projectStatus } from '../../lib/constants'

function NavItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-raised text-ink shadow-card' : 'text-muted hover:bg-raised/60 hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={16} className={isActive ? 'text-cyan' : ''} />
          {children}
        </>
      )}
    </NavLink>
  )
}

function DraggableProject({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.35 : 1 }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

function DropZone({ id, label, count, empty, collapsible, children }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className={label ? 'mt-3' : ''}>
      {label &&
        (collapsible ? (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center gap-1 px-3 pb-1 text-left"
          >
            <ChevronRight size={11} className={`text-faint transition-transform ${collapsed ? '' : 'rotate-90'}`} />
            <span className="font-mono text-[10px] uppercase tracking-widest text-faint">{label}</span>
            {count > 0 && <span className="ml-auto font-mono text-[10px] text-faint">{count}</span>}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 pb-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-faint">{label}</span>
            {count > 0 && <span className="font-mono text-[10px] text-faint">{count}</span>}
          </div>
        ))}
      <div
        ref={setNodeRef}
        className={`space-y-0.5 rounded-lg transition-colors ${isOver ? 'bg-raised/70 ring-1 ring-cyan/40' : ''} ${
          collapsed ? 'hidden' : ''
        }`}
      >
        {children}
        {empty && (
          <p className="rounded-lg border border-dashed border-edge px-3 py-2 text-[11px] text-faint">
            Arrastra un proyecto aquí
          </p>
        )}
      </div>
    </div>
  )
}

function ProjectRow({ p, count, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
        selected ? 'bg-raised text-ink shadow-card' : 'text-muted hover:bg-raised/60 hover:text-ink'
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${projectColor(p.color).dot}`} />
      <span className="flex-1 truncate text-left">{p.name}</span>
      <span className="font-mono text-[10px] text-faint">{count || ''}</span>
    </button>
  )
}

function ProjectList() {
  const { projects, tasks, updateProject } = useStore()
  const { filters, setFilters, openProjects, openNewProject } = useUI()
  const navigate = useNavigate()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const active = projects.filter((p) => projectStatus(p) === 'active')
  const finished = projects.filter((p) => projectStatus(p) === 'finished')
  const archived = projects.filter((p) => projectStatus(p) === 'archived')
  const count = (id) => tasks.filter((t) => t.projectId === id && t.column !== 'archived').length

  const select = (id) => {
    setFilters((f) => ({
      ...f,
      projects: f.projects.length === 1 && f.projects[0] === id ? [] : [id],
    }))
    navigate('/')
  }

  const onDragEnd = ({ active: dragged, over }) => {
    if (!over) return
    const zone = over.id
    if (zone !== 'active' && zone !== 'finished' && zone !== 'archived') return
    const project = projects.find((p) => p.id === dragged.id)
    if (project && projectStatus(project) !== zone) updateProject(project.id, { status: zone })
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-3">
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="font-mono text-[10px] tracking-widest text-faint">&lt;proyectos /&gt;</span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={openNewProject}
              title="Nuevo proyecto"
              aria-label="Nuevo proyecto"
              className="rounded-md p-1 text-faint transition-colors hover:bg-raised hover:text-ink"
            >
              <Plus size={13} />
            </button>
            <button
              onClick={openProjects}
              title="Gestionar proyectos"
              aria-label="Gestionar proyectos"
              className="rounded-md p-1 text-faint transition-colors hover:bg-raised hover:text-ink"
            >
              <Settings2 size={12} />
            </button>
          </div>
        </div>
        <DropZone id="active" label="" empty={false}>
          {active.map((p) => (
            <DraggableProject key={p.id} id={p.id}>
              <ProjectRow p={p} count={count(p.id)} selected={filters.projects.includes(p.id)} onSelect={() => select(p.id)} />
            </DraggableProject>
          ))}
          {active.length === 0 && (
            <button
              onClick={openProjects}
              className="w-full rounded-lg border border-dashed border-edge px-3 py-2 text-xs text-faint transition-colors hover:border-cyan/40 hover:text-ink"
            >
              + Crear proyecto
            </button>
          )}
        </DropZone>

        <DropZone
          id="finished"
          label="Proyectos Finalizados"
          count={finished.length}
          empty={finished.length === 0}
          collapsible
        >
          {finished.map((p) => (
            <DraggableProject key={p.id} id={p.id}>
              <ProjectRow p={p} count={count(p.id)} selected={filters.projects.includes(p.id)} onSelect={() => select(p.id)} />
            </DraggableProject>
          ))}
        </DropZone>

        <DropZone
          id="archived"
          label="Proyectos Archivados"
          count={archived.length}
          empty={archived.length === 0}
          collapsible
        >
          {archived.map((p) => (
            <DraggableProject key={p.id} id={p.id}>
              <ProjectRow p={p} count={count(p.id)} selected={filters.projects.includes(p.id)} onSelect={() => select(p.id)} />
            </DraggableProject>
          ))}
        </DropZone>
      </div>
    </DndContext>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { sidebarCollapsed, toggleSidebar } = useUI()
  const initial = (user.displayName || user.email || '?')[0].toUpperCase()

  // Escondido: el ancho baja a 0 y el contenido interior conserva su ancho (w-60)
  // para que no se re-maquete durante la animación. `invisible` (con transición de
  // visibilidad) lo saca además del foco de teclado.
  return (
    <aside
      className={`hidden shrink-0 overflow-hidden bg-surface transition-[width,visibility] duration-200 md:block ${
        sidebarCollapsed ? 'invisible w-0' : 'w-60 border-r border-edge'
      }`}
      aria-hidden={sidebarCollapsed}
    >
      <div className="flex h-full w-60 flex-col">
      <div className="flex items-start justify-between px-5 pb-5 pt-6">
        <div>
          <span className="eyebrow">&lt;kanbanpro /&gt;</span>
          <h1 className="grad-text font-display text-xl font-bold leading-tight">KanbanPro</h1>
        </div>
        <button
          onClick={toggleSidebar}
          title="Esconder barra lateral (Ctrl+B)"
          aria-label="Esconder barra lateral"
          className="-mr-2 mt-0.5 rounded-md p-1.5 text-faint transition-colors hover:bg-raised hover:text-ink"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        <NavItem to="/" icon={SquareKanban}>
          Tablero
        </NavItem>
        <NavItem to="/ideas" icon={Lightbulb}>
          Ideas
        </NavItem>
      </nav>
      <ProjectList />
      <div className="mt-auto flex items-center gap-3 border-t border-edge p-4">
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="grad-accent grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold text-white">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{user.displayName || 'Sin nombre'}</p>
          <p className="truncate text-xs text-faint">{user.email}</p>
        </div>
        <button
          onClick={logout}
          title="Cerrar sesión"
          className="rounded-lg p-2 text-faint transition-colors hover:bg-raised hover:text-ink"
        >
          <LogOut size={15} />
        </button>
      </div>
      </div>
    </aside>
  )
}
