import { useLocation } from 'react-router-dom'
import { Command, LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import FilterBar from '../board/FilterBar'

export default function TopBar() {
  const { pathname } = useLocation()
  const { prefs, setTheme } = useStore()
  const { setPaletteOpen } = useUI()
  const { logout } = useAuth()
  const isBoard = pathname === '/'
  const dark = prefs.theme !== 'light'

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-edge bg-surface/70 px-4 py-3 backdrop-blur md:px-6">
      <div className="md:hidden">
        <span className="grad-text font-display text-base font-bold">KanbanPro</span>
      </div>
      <div className="hidden md:block">
        <span className="eyebrow">{isBoard ? '<tablero />' : '<ideas />'}</span>
        <h2 className="font-display text-base font-semibold leading-tight text-ink">
          {isBoard ? 'Tablero' : 'Lluvia de ideas'}
        </h2>
      </div>

      {isBoard && <FilterBar />}

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden items-center gap-2 rounded-lg border border-edge bg-raised px-2.5 py-1.5 text-xs text-faint transition-colors hover:text-ink sm:flex"
          title="Command palette"
        >
          <Command size={12} />
          <span className="font-mono">K</span>
        </button>
        <button
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          title={dark ? 'Tema claro' : 'Tema oscuro'}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-raised hover:text-ink"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          onClick={logout}
          title="Cerrar sesión"
          className="rounded-lg p-2 text-muted transition-colors hover:bg-raised hover:text-ink md:hidden"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
