import { useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'
import { PRIORITIES, PRIORITY_ORDER } from '../../lib/constants'
import { selectCls } from '../../lib/ui'
import ProjectMultiSelect from './ProjectMultiSelect'

export default function FilterBar() {
  const { tasks, projects } = useStore()
  const { filters, setFilters, searchRef } = useUI()

  const allTags = useMemo(() => [...new Set(tasks.flatMap((t) => t.tags || []))].sort(), [tasks])
  const hasFilters = filters.search || filters.priority || filters.tag || filters.projects.length > 0

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <div className="relative min-w-[140px] max-w-xs flex-1">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          ref={searchRef}
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          placeholder="Buscar…  ( / )"
          className="w-full rounded-lg border border-edge bg-raised py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-faint focus:border-cyan/40 focus:outline-none focus:ring-1 focus:ring-cyan/40"
        />
      </div>
      <ProjectMultiSelect
        projects={projects}
        value={filters.projects}
        onChange={(projects) => setFilters((f) => ({ ...f, projects }))}
      />
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
      {hasFilters && (
        <button
          onClick={() => setFilters({ search: '', priority: '', tag: '', projects: [] })}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-faint transition-colors hover:text-ink"
        >
          <X size={12} /> Limpiar
        </button>
      )}
    </div>
  )
}
