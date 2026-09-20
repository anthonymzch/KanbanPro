// Máximo de capturas por tarjeta (las de la tarea, no las de corrección)
export const MAX_TASK_IMAGES = 10

const MAX_SIDE = 2000
const KEEP_AS_IS_BYTES = 1024 * 1024

// Reduce capturas pesadas antes de subirlas: si supera 1 MB o 2000 px de lado
// se reescala y se recomprime a JPEG. Las pequeñas (y los GIF) pasan intactas.
export async function prepareImage(file) {
  if (file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= KEEP_AS_IS_BYTES) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

// Imágenes que vienen en un evento de pegado (Ctrl+V de una captura)
export function imagesFromClipboard(e) {
  return [...(e.clipboardData?.items || [])]
    .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
    .map((it) => it.getAsFile())
    .filter(Boolean)
}
