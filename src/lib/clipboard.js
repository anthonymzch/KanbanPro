import { Capacitor } from '@capacitor/core'
import { Clipboard } from '@capacitor/clipboard'

export async function writeClipboard(text) {
  if (Capacitor.isNativePlatform()) {
    await Clipboard.write({ string: text })
    return
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  if (!copied) throw new Error('No se pudo copiar al portapapeles')
}
