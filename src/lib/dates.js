// dueDate se guarda como 'YYYY-MM-DD'.
export function dueMeta(dueDate) {
  if (!dueDate) return null
  const [y, m, d] = dueDate.split('-').map(Number)
  if (!y || !m || !d) return null
  const endOfDay = new Date(y, m - 1, d, 23, 59, 59)
  const now = new Date()
  const overdue = endOfDay < now
  const soon = !overdue && endOfDay - now < 48 * 3600 * 1000
  const label = new Date(y, m - 1, d).toLocaleDateString('es', { day: 'numeric', month: 'short' })
  return { overdue, soon, label }
}
