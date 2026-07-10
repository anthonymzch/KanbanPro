import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, Lightbulb, Moon, Plus, Search, SquareKanban, Sun } from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { useUI } from '../../hooks/useUI'

const norm = (s) => (s || '').toLowerCase()

export default function CommandPalette() {
  const { tasks, ideas, prefs, setTheme } = useStore()
  const { setPaletteOpen, openTaskModal, openIdeaModal, focusSearch, openProjects } = useUI()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)

  const close = () => setPaletteOpen(false)

  const items = useMemo(() => {
    const q = norm(query)
    const actions = [
      { id: 'a1', section: 'Acciones', label: 'Nueva tarea', icon: Plus, kbd: 'N', run: () => openTaskModal() },
      { id: 'a2', section: 'Acciones', label: 'Nueva idea', icon: Lightbulb, kbd: 'I', run: () => openIdeaModal() },
      { id: 'a3', section: 'Acciones', label: 'Ir al tablero', icon: SquareKanban, run: () => navigate('/') },
      { id: 'a4', section: 'Acciones', label: 'Ir a ideas', icon: Lightbulb, run: () => navigate('/ideas') },
      { id: 'a5', section: 'Acciones', label: 'Buscar en el tablero', icon: Search, kbd: '/', run: () => focusSearch() },
      { id: 'a7', section: 'Acciones', label: 'Gestionar proyectos', icon: Folder, run: () => openProjects() },
      {
        id: 'a6',
        section: 'Acciones',
        label: prefs.theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro',
        icon: prefs.theme === 'light' ? Moon : Sun,
        run: () => setTheme(prefs.theme === 'light' ? 'dark' : 'light'),
      },
    ].filter((a) => !q || norm(a.label).includes(q))

    const taskHits = q
      ? tasks
          .filter((t) => norm(t.title).includes(q))
          .slice(0, 5)
          .map((t) => ({
            id: `t-${t.id}`,
            section: 'Tareas',
            label: t.title,
            icon: SquareKanban,
            run: () => {
              navigate('/')
              openTaskModal(t)
            },
          }))
      : []

    const ideaHits = q
      ? ideas
          .filter((i) => norm(i.title).includes(q))
          .slice(0, 5)
          .map((i) => ({
            id: `i-${i.id}`,
            section: 'Ideas',
            label: i.title,
            icon: Lightbulb,
            run: () => {
              navigate('/ideas')
              openIdeaModal(i)
            },
          }))
      : []

    return [...actions, ...taskHits, ...ideaHits]
  }, [query, tasks, ideas, prefs.theme, navigate, openTaskModal, openIdeaModal, focusSearch, setTheme, openProjects])

  const sel = Math.min(index, Math.max(items.length - 1, 0))

  const runItem = (item) => {
    close()
    item.run()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && items[sel]) {
      e.preventDefault()
      runItem(items[sel])
    } else if (e.key === 'Escape') {
      close()
    }
  }

  let lastSection = null

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={close} />
      <div className="relative mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-2xl border border-edge bg-surface shadow-glow-violet animate-scale-in">
        <div className="flex items-center gap-3 border-b border-edge px-4">
          <Search size={16} className="text-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIndex(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Escribe un comando o busca…"
            className="w-full bg-transparent py-3.5 text-sm text-ink placeholder:text-faint focus:outline-none"
          />
          <kbd className="rounded border border-edge bg-raised px-1.5 py-0.5 font-mono text-[10px] text-faint">esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 && <p className="px-3 py-8 text-center text-sm text-faint">Sin resultados para “{query}”</p>}
          {items.map((item, i) => {
            const header = item.section !== lastSection ? item.section : null
            lastSection = item.section
            const Icon = item.icon
            return (
              <div key={item.id}>
                {header && (
                  <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-faint">{header}</p>
                )}
                <button
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => runItem(item)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    i === sel ? 'bg-raised text-ink' : 'text-muted'
                  }`}
                >
                  <Icon size={15} className={i === sel ? 'text-cyan' : 'text-faint'} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.kbd && (
                    <kbd className="rounded border border-edge bg-raised px-1.5 py-0.5 font-mono text-[10px] text-faint">
                      {item.kbd}
                    </kbd>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
