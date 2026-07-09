import { NavLink, Outlet } from 'react-router-dom'
import { Lightbulb, SquareKanban } from 'lucide-react'
import { useUI } from '../../hooks/useUI'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import TaskModal from '../board/TaskModal'
import IdeaFormModal from '../ideas/IdeaFormModal'
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
  const { taskModal, ideaModal, paletteOpen } = useUI()

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
      {paletteOpen && <CommandPalette />}
    </div>
  )
}
