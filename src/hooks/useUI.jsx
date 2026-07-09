import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  // taskModal: null | { task: obj|null, column: string }
  const [taskModal, setTaskModal] = useState(null)
  // ideaModal: null | { idea: obj|null }
  const [ideaModal, setIdeaModal] = useState(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [filters, setFilters] = useState({ search: '', priority: '', tag: '' })
  const searchRef = useRef(null)
  const navigate = useNavigate()

  const value = useMemo(
    () => ({
      taskModal,
      ideaModal,
      paletteOpen,
      filters,
      searchRef,
      setFilters,
      setPaletteOpen,
      openTaskModal: (task = null, column = 'backlog') => setTaskModal({ task, column }),
      closeTaskModal: () => setTaskModal(null),
      openIdeaModal: (idea = null) => setIdeaModal({ idea }),
      closeIdeaModal: () => setIdeaModal(null),
      focusSearch: () => {
        navigate('/')
        setTimeout(() => searchRef.current?.focus(), 60)
      },
    }),
    [taskModal, ideaModal, paletteOpen, filters, navigate],
  )

  // Atajos globales: N tarea, I idea, / buscar, Cmd/Ctrl+K paleta
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
        return
      }
      const t = e.target
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (taskModal || ideaModal || paletteOpen) return
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
  }, [taskModal, ideaModal, paletteOpen, value])

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export const useUI = () => useContext(UIContext)
