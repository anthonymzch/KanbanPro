import { PRIORITIES } from './constants'

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

export function buildColumnExport(column, tasks, projects = []) {
  const stamp = new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
  const header = [
    `Tablero KanbanPro — columna "${column.label}" (${tasks.length} tarea${tasks.length === 1 ? '' : 's'})`,
    `Exportado: ${stamp}`,
    '',
    'Instrucciones: trabaja estas tareas una por una, en el orden en que aparecen. Al terminar cada una, avísame antes de pasar a la siguiente.',
  ].join('\n')

  if (!tasks.length) return `${header}\n\n(La columna está vacía.)\n`

  const body = tasks
    .map((task, i) =>
      taskBlock(task, i + 1, tasks.length, task.projectId ? projects.find((p) => p.id === task.projectId) : null)
    )
    .join(SEPARATOR)

  return `${header}${SEPARATOR}${body}\n`
}
