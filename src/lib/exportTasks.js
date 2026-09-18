import { DEFAULT_EXPORT_PROMPT, PRIORITIES } from './constants'

const SEPARATOR = `\n\n${'─'.repeat(40)}\n\n`

function taskBlock(task, index, total, project) {
  const lines = [`Tarea ${index}/${total}: ${task.title}`]
  if (project) lines.push(`Proyecto: ${project.name}`)
  const prio = PRIORITIES[task.priority]
  if (prio) lines.push(`Prioridad: ${prio.label}`)
  if (task.dueDate) lines.push(`Fecha límite: ${task.dueDate}`)
  if ((task.tags || []).length) lines.push(`Etiquetas: ${task.tags.join(', ')}`)

  if (task.description?.trim()) {
    lines.push('', 'Descripción:', task.description.trim())
  }

  const subtasks = task.subtasks || []
  if (subtasks.length) {
    lines.push('', 'Subtareas:', ...subtasks.map((s) => `- [${s.done ? 'x' : ' '}] ${s.title}`))
  }

  return lines.join('\n')
}

export function buildColumnExport(column, tasks, projects = [], instructions = DEFAULT_EXPORT_PROMPT) {
  const stamp = new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
  const header = [
    `Tablero KanbanPro — columna "${column.label}" (${tasks.length} tarea${tasks.length === 1 ? '' : 's'})`,
    `Exportado: ${stamp}`,
    '',
    `Instrucciones: ${(instructions || DEFAULT_EXPORT_PROMPT).trim()}`,
  ].join('\n')

  if (!tasks.length) return `${header}\n\n(La columna está vacía.)\n`

  const body = tasks
    .map((task, i) =>
      taskBlock(task, i + 1, tasks.length, task.projectId ? projects.find((p) => p.id === task.projectId) : null)
    )
    .join(SEPARATOR)

  return `${header}${SEPARATOR}${body}\n`
}

export function buildCorrectionsExport(tasks, projects = []) {
  const toFix = tasks.filter((t) => t.reviewStatus === 'fix' && t.correctionNote?.trim())
  if (!toFix.length) return ''

  const header = [
    `Correcciones pendientes — columna "Revisión" (${toFix.length} tarea${toFix.length === 1 ? '' : 's'})`,
    '',
    'Instrucciones: corrige cada tarea según lo indicado, una por una. Al terminar todas, dime qué corregiste en cada una.',
  ].join('\n')

  const body = toFix
    .map((task, i) => {
      const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null
      const lines = [`Corrección ${i + 1}/${toFix.length}: ${task.title}`]
      if (project) lines.push(`Proyecto: ${project.name}`)
      lines.push('', 'Qué corregir:', task.correctionNote.trim())
      return lines.join('\n')
    })
    .join(SEPARATOR)

  return `${header}${SEPARATOR}${body}\n`
}
