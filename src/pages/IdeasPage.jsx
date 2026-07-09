import { useMemo, useState } from 'react'
import { Lightbulb, Plus } from 'lucide-react'
import IdeaCard from '../components/ideas/IdeaCard'
import EmptyState from '../components/ui/EmptyState'
import { useStore } from '../hooks/useStore'
import { useUI } from '../hooks/useUI'
import { IDEA_CATEGORIES } from '../lib/constants'
import { btnPrimary, selectCls } from '../lib/ui'

export default function IdeasPage() {
  const { ideas } = useStore()
  const { openIdeaModal } = useUI()
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('votes')

  const visible = useMemo(() => {
    const list = ideas.filter((i) => !category || i.category === category)
    return [...list].sort((a, b) =>
      sort === 'votes'
        ? (b.votes || 0) - (a.votes || 0)
        : (b.createdAt?.toMillis?.() ?? Date.now()) - (a.createdAt?.toMillis?.() ?? Date.now()),
    )
  }, [ideas, category, sort])

  const chip = (active) =>
    `rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
      active ? 'border-violet/50 bg-violet/10 text-violet shadow-glow-violet' : 'border-edge bg-raised text-muted hover:text-ink'
    }`

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button className={chip(!category)} onClick={() => setCategory('')}>
          Todas
        </button>
        {Object.entries(IDEA_CATEGORIES).map(([id, cat]) => (
          <button key={id} className={chip(category === id)} onClick={() => setCategory(id)}>
            {cat.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${selectCls} py-1.5 text-xs`}>
            <option value="votes">Más votadas</option>
            <option value="recent">Más recientes</option>
          </select>
          <button className={`${btnPrimary} flex items-center gap-1.5`} onClick={() => openIdeaModal()}>
            <Plus size={15} /> Nueva idea
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Aún no hay ideas por aquí"
          hint="Pulsa I o el botón «Nueva idea» para capturar la primera"
        />
      ) : (
        <div className="grid gap-4 pb-6 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  )
}
