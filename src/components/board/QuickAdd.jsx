import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../../hooks/useStore'

export default function QuickAdd({ column }) {
  const { addTask } = useStore()
  const [value, setValue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const title = value.trim()
    if (!title) return
    addTask({ title, column })
    setValue('')
  }

  return (
    <form onSubmit={submit} className="relative p-2 pt-1">
      <Plus size={13} className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-[3px] text-faint" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Añadir tarea"
        className="w-full rounded-lg border border-dashed border-edge bg-transparent py-2 pl-8 pr-3 text-xs text-ink placeholder:text-faint transition-colors focus:border-solid focus:border-cyan/40 focus:bg-raised focus:outline-none"
      />
    </form>
  )
}
