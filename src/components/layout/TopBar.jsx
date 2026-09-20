import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Columns3, Command, Eye, LogOut, Moon, PanelLeftOpen, Plus, Sun } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import FilterBar from '../board/FilterBar'
import { ColumnForm } from '../board/ColumnsModal'
import { COLUMNS, projectColor } from '../../lib/constants'

function HiddenColumnsMenu() {
  const { prefs, customColumns, setHiddenColumns } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const hidden = prefs.hiddenColumns || []
  const allColumns = [...COLUMNS, ...customColumns.map((c) => ({ ...c, custom: true }))]
  const hiddenColumns = allColumns.filter((c) => hidden.includes(c.id))

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const restore = (id) => setHiddenColumns(hidden.filter((h) => h !== id))

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={hiddenColumns.length === 0}
        title={hiddenColumns.length ? `Mostrar columnas ocultas (${hiddenColumns.length})` : 'No hay columnas ocultas'}
        className="relative mt-0.5 rounded-md p-1 text-faint transition-colors hover:bg-raised hover:text-ink disabled:pointer-events-none disabled:opacity-30"
      >
        <Eye size={14} />
        {hiddenColumns.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-cyan text-[9px] font-bold text-[#0A0E16]">
            {hiddenColumns.length}
          </span>
        )}
      </button>
      {open && hiddenColumns.length > 0 && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-30 min-w-[180px] rounded-lg border border-edge bg-surface p-1 shadow-card">
          {hiddenColumns.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => restore(c.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink transition-colors hover:bg-raised"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${c.custom ? projectColor(c.color).dot : 'bg-slate-400'}`} />
              <span className="flex-1 truncate text-left">{c.label}</span>
              <span className="text-[10px] text-faint">Mostrar</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function QuickAddColumn() {
  const { addColumn } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Nueva columna"
        className="mt-0.5 rounded-md p-1 text-faint transition-colors hover:bg-raised hover:text-ink"
      >
        <Plus size={14} />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-64 rounded-lg border border-edge bg-surface p-3 shadow-card">
          <ColumnForm
            onSave={(data) => {
              addColumn(data)
              setOpen(false)
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  )
}

export default function TopBar() {
  const { pathname } = useLocation()
  const { prefs, setTheme } = useStore()
  const { setPaletteOpen, openColumns, sidebarCollapsed, toggleSidebar } = useUI()
  const { logout } = useAuth()
  const isBoard = pathname === '/'
  const dark = prefs.theme !== 'light'

  return (
    <header className="relative z-20 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-edge bg-surface/70 px-4 py-3 backdrop-blur md:px-6">
      <div className="md:hidden">
        <span className="grad-text font-display text-base font-bold">KanbanPro</span>
      </div>
      <div className="hidden items-start gap-1.5 md:flex">
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            title="Mostrar barra lateral (Ctrl+B)"
            aria-label="Mostrar barra lateral"
            className="-ml-1.5 mr-1 mt-0.5 rounded-md p-1.5 text-faint transition-colors hover:bg-raised hover:text-ink"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
        <div>
          <span className="eyebrow">{isBoard ? '<tablero />' : '<ideas />'}</span>
          <h2 className="font-display text-base font-semibold leading-tight text-ink">
            {isBoard ? 'Tablero' : 'Lluvia de ideas'}
          </h2>
        </div>
        {isBoard && (
          <>
            <button
              onClick={openColumns}
              title="Gestionar columnas"
              className="mt-0.5 rounded-md p-1 text-faint transition-colors hover:bg-raised hover:text-ink"
            >
              <Columns3 size={14} />
            </button>
            <HiddenColumnsMenu />
            <QuickAddColumn />
          </>
        )}
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
