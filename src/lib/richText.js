// Las descripciones se guardan como Markdown: las tareas antiguas (texto plano)
// siguen siendo válidas, el export para Claude sigue siendo texto y las imágenes
// incrustadas son `![](url)`.

// URLs de imágenes de Firebase Storage incrustadas en un texto Markdown
export function extractImageUrls(markdown) {
  if (!markdown) return []
  const urls = []
  const re = /!\[[^\]]*\]\((\S+?)(?:\s+"[^"]*")?\)/g
  let m
  while ((m = re.exec(markdown))) {
    if (m[1].includes('firebasestorage.googleapis.com')) urls.push(m[1])
  }
  return [...new Set(urls)]
}
