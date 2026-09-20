import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const UIContext = createContext(null)

const PROJECT_FILTER_KEY = 'kanbanpro:lastProjectFilter'

const SIDEBAR_KEY = 'kanbanpro:sidebarCollapsed'

function loadSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === '1'
  } catch {
    return false
  }
}

function loadStoredProjectFilter() {
  try {
    const raw = localStorage.getItem(PROJECT_FILTER_KEY)
    const ids = raw ? JSON.parse(raw) : []
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

export function UIProvider({ children }) {
  // taskModal: null | { task: obj|null, column: string }
  const [taskModal, setTaskModal] = useState(null)
  // ideaModal: null | { idea: obj|null }
  const [ideaModal, setIdeaModal] = useState(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [filters, setFilters] = useState({ search: '', priority: '', tag: '', projects: loadStoredProjectFilter() })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(loadSidebarCollapsed)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  // Recuerda si el sidebar estaba escondido entre recargas
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed ? '1' : '0')
    } catch {
      // localStorage no disponible
    }
  }, [sidebarCollapsed])

  // Recuerda el último proyecto (o proyectos) filtrado entre recargas
  useEffect(() => {
    try {
      localStorage.setItem(PROJECT_FILTER_KEY, JSON.stringify(filters.projects))
    } catch {
      // localStorage no disponible
    }
  }, [filters.projects])

  const value = useMemo(
    () => ({
      taskModal,
      ideaModal,
      paletteOpen,
      projectsOpen,
      columnsOpen,
      filters,
      searchRef,
      sidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((c) => !c),
      setFilters,
      setPaletteOpen,
      // projectsOpen: false | true (gestionar) | 'new' (abre ya el formulario de nuevo proyecto)
      openProjects: () => setProjectsOpen(true),
      openNewProject: () => setProjectsOpen('new'),
      closeProjects: () => setProjectsOpen(false),
      openColumns: () => setColumnsOpen(true),
      closeColumns: () => setColumnsOpen(false),
      openTaskModal: (task = null, column = 'backlog') => setTaskModal({ task, column }),
      closeTaskModal: () => setTaskModal(null),
      openIdeaModal: (idea = null) => setIdeaModal({ idea }),
      closeIdeaModal: () => setIdeaModal(null),
      focusSearch: () => {
        navigate('/')
        setTimeout(() => searchRef.current?.focus(), 60)
      },
    }),
    [taskModal, ideaModal, paletteOpen, projectsOpen, columnsOpen, filters, sidebarCollapsed, navigate],
  )

  // Atajos globales: N tarea, I idea, / buscar, Cmd/Ctrl+K paleta
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
        return
      }
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setSidebarCollapsed((c) => !c)
        return
      }
      const t = e.target
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (taskModal || ideaModal || paletteOpen || projectsOpen || columnsOpen) return
      const k = e.key.toLowerCase()
      if (k === 'n') {
        e.preventDefault()
        setTaskModal({ task: null, column: 'backlog' })
      } else if (k === 'i') {
        e.preventDefault()
        setIdeaModal({ idea: null })
      } else if (e.key === '/') {
        e.preventDefault()
        value.focusSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [taskModal, ideaModal, paletteOpen, projectsOpen, columnsOpen, value])

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export const useUI = () => useContext(UIContext)
