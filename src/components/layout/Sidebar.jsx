import { NavLink, useNavigate } from 'react-router-dom'
import { Lightbulb, LogOut, Settings2, SquareKanban } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import { projectColor } from '../../lib/constants'

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

function ProjectList() {
  const { projects, tasks } = useStore()
  const { filters, setFilters, openProjects } = useUI()
  const navigate = useNavigate()

  const count = (id) => tasks.filter((t) => t.projectId === id && t.column !== 'archived').length

  const select = (id) => {
    setFilters((f) => ({ ...f, project: f.project === id ? '' : id }))
    navigate('/')
  }

  return (
    <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
      <div className="flex items-center justify-between px-3 pb-1">
        <span className="font-mono text-[10px] tracking-widest text-faint">&lt;proyectos /&gt;</span>
        <button
          onClick={openProjects}
          title="Gestionar proyectos"
          className="rounded-md p-1 text-faint transition-colors hover:bg-raised hover:text-ink"
        >
          <Settings2 size={12} />
        </button>
      </div>
      {projects.map((p) => (
        <button
          key={p.id}
          onClick={() => select(p.id)}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
            filters.project === p.id ? 'bg-raised text-ink shadow-card' : 'text-muted hover:bg-raised/60 hover:text-ink'
          }`}
        >
          <span className={`h-2 w-2 shrink-0 rounded-full ${projectColor(p.color).dot}`} />
          <span className="flex-1 truncate text-left">{p.name}</span>
          <span className="font-mono text-[10px] text-faint">{count(p.id) || ''}</span>
        </button>
      ))}
      {projects.length === 0 && (
        <button
          onClick={openProjects}
          className="w-full rounded-lg border border-dashed border-edge px-3 py-2 text-xs text-faint transition-colors hover:border-cyan/40 hover:text-ink"
        >
          + Crear proyecto
        </button>
      )}
    </div>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const initial = (user.displayName || user.email || '?')[0].toUpperCase()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-edge bg-surface md:flex">
      <div className="px-5 pb-5 pt-6">
        <span className="eyebrow">&lt;kanbanpro /&gt;</span>
        <h1 className="grad-text font-display text-xl font-bold leading-tight">KanbanPro</h1>
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
    </aside>
  )
}
