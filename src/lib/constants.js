export const COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'Por hacer' },
  { id: 'inprogress', label: 'En progreso' },
  { id: 'done', label: 'Hecho' },
  { id: 'archived', label: 'Archivado' },
]

export const COLUMN_IDS = COLUMNS.map((c) => c.id)

export const PRIORITIES = {
  baja: { label: 'Baja', badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  media: { label: 'Media', badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  alta: { label: 'Alta', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  urgente: { label: 'Urgente', badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
}

export const PRIORITY_ORDER = ['baja', 'media', 'alta', 'urgente']

// Paleta para etiquetas: color estable derivado del nombre.
export const TAG_PALETTE = [
  'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'bg-rose-500/15 text-rose-400 border-rose-500/30',
  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
  'bg-lime-500/15 text-lime-400 border-lime-500/30',
]

export function tagColor(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

export const IDEA_CATEGORIES = {
  'nueva-app': { label: 'Nueva app', eyebrow: '<nueva-app />' },
  'mejora': { label: 'Mejora de app', eyebrow: '<mejora />' },
}

export const IDEA_STATUSES = {
  nueva: { label: 'Nueva', badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  evaluacion: { label: 'En evaluación', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  aprobada: { label: 'Aprobada', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  descartada: { label: 'Descartada', badge: 'bg-slate-500/15 text-slate-500 border-slate-500/30' },
}

export const IDEA_STATUS_ORDER = ['nueva', 'evaluacion', 'aprobada', 'descartada']

export const DEFAULT_WIP_LIMIT = 5
