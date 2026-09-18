// Reparte el resumen final que pega el usuario entre las tareas a las que
// corresponde cada bloque, reconociendo encabezados de sección tipo:
//   "### Tarea: <título>", "Tarea 1/3: <título>", "**<título>**" o el
// título suelto en su propia línea (con o sin numeración/markdown).
function normalizeHeading(line) {
  return line
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[-*]\s*/, '')
    .replace(/^\d+[).]\s*/, '')
    .replace(/^tarea\s*\d*\s*(\/\s*\d+)?:?\s*/i, '')
    .replace(/\*\*/g, '')
    .trim()
    .replace(/[:.]+$/, '')
    .toLowerCase()
}

// Devuelve { [taskId]: nota } si detecta encabezados que casan con los
// títulos de `tasks`, o null si el texto no parece tener esa estructura
// (para que quien llame pueda usar el texto completo como respaldo).
export function splitReviewNotes(text, tasks) {
  if (!text?.trim() || !tasks.length) return null

  const titleMap = tasks.map((t) => ({ task: t, norm: t.title.trim().toLowerCase() }))
  const lines = text.split(/\r?\n/)
  const hits = []

  lines.forEach((line, i) => {
    const norm = normalizeHeading(line)
    if (!norm) return
    const found = titleMap.find((tm) => tm.norm === norm)
    if (found) hits.push({ index: i, taskId: found.task.id })
  })

  if (!hits.length) return null

  const notes = {}
  hits.forEach((hit, i) => {
    const start = hit.index + 1
    const end = i + 1 < hits.length ? hits[i + 1].index : lines.length
    notes[hit.taskId] = lines.slice(start, end).join('\n').trim()
  })
  return notes
}
