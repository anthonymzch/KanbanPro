import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Lightbulb, SquareKanban } from 'lucide-react'
import { useUI } from '../../hooks/useUI'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import TaskModal from '../board/TaskModal'
import ColumnsModal from '../board/ColumnsModal'
import IdeaFormModal from '../ideas/IdeaFormModal'
import ProjectsModal from '../projects/ProjectsModal'
import CommandPalette from '../ui/CommandPalette'

function MobileNav() {
  const item = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
      isActive ? 'text-cyan' : 'text-faint'
    }`
  return (
    <nav className="flex border-t border-edge bg-surface md:hidden">
      <NavLink to="/" end className={item}>
        <SquareKanban size={18} />
        Tablero
      </NavLink>
      <NavLink to="/ideas" className={item}>
        <Lightbulb size={18} />
        Ideas
      </NavLink>
    </nav>
  )
}

export default function AppShell() {
  const {
    taskModal,
    ideaModal,
    paletteOpen,
    projectsOpen,
    columnsOpen,
    closeTaskModal,
    closeIdeaModal,
    setPaletteOpen,
    closeProjects,
    closeColumns,
  } = useUI()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined

    let listener
    let cancelled = false
    CapacitorApp.addListener('backButton', () => {
      if (paletteOpen) setPaletteOpen(false)
      else if (taskModal) closeTaskModal()
      else if (ideaModal) closeIdeaModal()
      else if (projectsOpen) closeProjects()
      else if (columnsOpen) closeColumns()
      else if (location.pathname !== '/') navigate('/')
      else CapacitorApp.exitApp()
    }).then((handle) => {
      if (cancelled) handle.remove()
      else listener = handle
    })

    return () => {
      cancelled = true
      listener?.remove()
    }
  }, [
    columnsOpen,
    ideaModal,
    location.pathname,
    navigate,
    paletteOpen,
    projectsOpen,
    taskModal,
    closeColumns,
    closeIdeaModal,
    closeProjects,
    closeTaskModal,
    setPaletteOpen,
  ])

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1">
          <Outlet />
        </main>
        <MobileNav />
      </div>

      {taskModal && <TaskModal />}
      {ideaModal && <IdeaFormModal />}
      {projectsOpen && <ProjectsModal />}
      {columnsOpen && <ColumnsModal />}
      {paletteOpen && <CommandPalette />}
    </div>
  )
}
