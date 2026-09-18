import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Search, Settings2, SlidersHorizontal, X } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import { FILTER_DEFS, PRIORITIES, PRIORITY_ORDER } from '../../lib/constants'
import { selectCls } from '../../lib/ui'
import ProjectMultiSelect from './ProjectMultiSelect'

const EMPTY_VALUE = { projects: [], priority: '', tag: '' }

function FilterVisibilityMenu({ hidden, onToggle }) {
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
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Elegir qué filtros mostrar"
        className="rounded-lg p-1.5 text-faint transition-colors hover:bg-raised hover:text-ink"
      >
        <Settings2 size={14} />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-20 min-w-[170px] rounded-lg border border-edge bg-surface p-1 shadow-card">
          {FILTER_DEFS.map((f) => {
            const visible = !hidden.includes(f.id)
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onToggle(f.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink transition-colors hover:bg-raised"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    visible ? 'border-cyan bg-cyan/20' : 'border-edge'
                  }`}
                >
                  {visible && <Check size={11} className="text-cyan" />}
                </span>
                <span className="flex-1 truncate text-left">{f.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function FilterBar() {
  const { tasks, projects, prefs, setHiddenFilters } = useStore()
  const { filters, setFilters, searchRef } = useUI()
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeProjects = useMemo(() => projects.filter((p) => !p.archived), [projects])
  const allTags = useMemo(() => [...new Set(tasks.flatMap((t) => t.tags || []))].sort(), [tasks])
  const hasFilters = filters.search || filters.priority || filters.tag || filters.projects.length > 0
  const hasExtraFilters = filters.priority || filters.tag || filters.projects.length > 0

  const hiddenFilters = prefs.hiddenFilters || []
  const showFilter = (id) => !hiddenFilters.includes(id)

  const toggleFilterVisibility = (id) => {
    const nextHidden = hiddenFilters.includes(id) ? hiddenFilters.filter((h) => h !== id) : [...hiddenFilters, id]
    // Al ocultar un filtro activo, lo limpiamos para que no quede filtrando "a ciegas"
    if (nextHidden.includes(id) && filters[id] !== EMPTY_VALUE[id]) {
      setFilters((f) => ({ ...f, [id]: EMPTY_VALUE[id] }))
    }
    setHiddenFilters(nextHidden)
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex items-center gap-2">
        <div className="relative min-w-[140px] max-w-xs flex-1 sm:flex-initial">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            ref={searchRef}
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Buscar…  ( / )"
            className="w-full rounded-lg border border-edge bg-raised py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-faint focus:border-cyan/40 focus:outline-none focus:ring-1 focus:ring-cyan/40"
          />
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className={`relative flex shrink-0 items-center gap-1.5 rounded-lg border border-edge bg-raised px-2.5 py-1.5 text-xs text-faint transition-colors hover:text-ink sm:hidden ${mobileOpen ? 'text-ink' : ''}`}
        >
          <SlidersHorizontal size={13} />
          Filtros
          {hasExtraFilters && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-cyan" />}
        </button>
      </div>
      <div className={`${mobileOpen ? 'flex' : 'hidden'} flex-wrap items-center gap-2 sm:flex`}>
        {showFilter('projects') && (
          <ProjectMultiSelect
            projects={activeProjects}
            value={filters.projects}
            onChange={(projects) => setFilters((f) => ({ ...f, projects }))}
          />
        )}
        {showFilter('priority') && (
          <select
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            className={`${selectCls} py-1.5`}
          >
            <option value="">Prioridad</option>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITIES[p].label}
              </option>
            ))}
          </select>
        )}
        {showFilter('tag') && (
          <select
            value={filters.tag}
            onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}
            className={`${selectCls} py-1.5`}
          >
            <option value="">Etiqueta</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
        {hasFilters && (
          <button
            onClick={() => setFilters((f) => ({ ...f, search: '', priority: '', tag: '', projects: [] }))}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-faint transition-colors hover:text-ink"
          >
            <X size={12} /> Limpiar
          </button>
        )}
        <FilterVisibilityMenu hidden={hiddenFilters} onToggle={toggleFilterVisibility} />
      </div>
    </div>
  )
}
