import { NavLink } from 'react-router-dom'
import { Lightbulb, LogOut, SquareKanban } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

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
