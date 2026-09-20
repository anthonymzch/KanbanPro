import { useEffect, useReducer, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { TaskItem } from '@tiptap/extension-list'
import { Markdown } from 'tiptap-markdown'
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from 'lucide-react'
import { imagesFromClipboard } from '../../lib/images'
import { MdHardBreak, MdTaskList } from '../../lib/markdownExtensions'

function ToolbarButton({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      // mousedown no debe quitarle el foco (y la selección) al editor
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-30 ${
        active ? 'bg-cyan/15 text-cyan' : 'text-muted hover:bg-raised hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-edge" />

function Toolbar({ editor, onPickImage, uploading }) {
  // El editor no re-renderiza con cada transacción: forzamos el repintado para el estado activo
  const [, force] = useReducer((n) => n + 1, 0)
  useEffect(() => {
    editor.on('transaction', force)
    return () => editor.off('transaction', force)
  }, [editor])

  const chain = () => editor.chain().focus()
  const setLink = () => {
    const prev = editor.getAttributes('link').href || ''
    const url = window.prompt('Dirección del enlace (déjala vacía para quitarlo)', prev)
    if (url === null) return
    if (!url.trim()) chain().extendMarkRange('link').unsetLink().run()
    else chain().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-edge bg-surface px-3 py-1.5">
      <ToolbarButton title="Deshacer (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}>
        <Undo2 size={15} />
      </ToolbarButton>
      <ToolbarButton title="Rehacer (Ctrl+Y)" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}>
        <Redo2 size={15} />
      </ToolbarButton>
      <Sep />
      {[1, 2, 3].map((level) => {
        const Icon = [Heading1, Heading2, Heading3][level - 1]
        return (
          <ToolbarButton
            key={level}
            title={`Título ${level}`}
            active={editor.isActive('heading', { level })}
            onClick={() => chain().toggleHeading({ level }).run()}
          >
            <Icon size={16} />
          </ToolbarButton>
        )
      })}
      <Sep />
      <ToolbarButton title="Negrita (Ctrl+B)" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}>
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton title="Cursiva (Ctrl+I)" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()}>
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton title="Tachado" active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough size={15} />
      </ToolbarButton>
      <ToolbarButton title="Código en línea" active={editor.isActive('code')} onClick={() => chain().toggleCode().run()}>
        <Code size={15} />
      </ToolbarButton>
      <Sep />
      <ToolbarButton title="Lista con viñetas" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()}>
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton title="Lista numerada" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton title="Lista de tareas" active={editor.isActive('taskList')} onClick={() => chain().toggleTaskList().run()}>
        <ListChecks size={16} />
      </ToolbarButton>
      <Sep />
      <ToolbarButton title="Cita" active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()}>
        <Quote size={15} />
      </ToolbarButton>
      <ToolbarButton title="Bloque de código" active={editor.isActive('codeBlock')} onClick={() => chain().toggleCodeBlock().run()}>
        <Code2 size={16} />
      </ToolbarButton>
      <ToolbarButton title="Línea separadora" onClick={() => chain().setHorizontalRule().run()}>
        <Minus size={16} />
      </ToolbarButton>
      <Sep />
      <ToolbarButton title="Enlace" active={editor.isActive('link')} onClick={setLink}>
        <Link2 size={15} />
      </ToolbarButton>
      <ToolbarButton title="Insertar imagen (también puedes pegar o arrastrar)" disabled={uploading} onClick={onPickImage}>
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
      </ToolbarButton>
    </div>
  )
}

// Campo de descripción: caja compacta que se puede expandir a un editor de
// pantalla completa tipo documento (formato + imágenes incrustadas).
// `value`/`onChange` trabajan en Markdown.
export default function RichTextEditor({ value, onChange, onUploadImage, onUploadingChange, placeholder, title }) {
  const [expanded, setExpanded] = useState(false)
  const [uploading, setUploading] = useState(0)
  const fileRef = useRef(null)

  // Los handlers de ProseMirror se crean una sola vez: leen siempre lo último desde aquí
  const latest = useRef({})
  latest.current = { onChange, onUploadImage }

  const insertFiles = async (files, pos) => {
    if (!latest.current.onUploadImage) return
    setUploading((n) => n + files.length)
    for (const file of files) {
      const url = await latest.current.onUploadImage(file)
      setUploading((n) => n - 1)
      if (!url || editorRef.current?.isDestroyed) continue
      const chain = editorRef.current.chain().focus()
      if (pos != null) chain.setTextSelection(Math.min(pos, editorRef.current.state.doc.content.size))
      chain.setImage({ src: url }).run()
      pos = null
    }
  }
  const editorRef = useRef(null)
  const insertFilesRef = useRef(insertFiles)
  insertFilesRef.current = insertFiles

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        underline: false, // Markdown no tiene subrayado
        hardBreak: false, // se sustituye por MdHardBreak
        link: { openOnClick: false, autolink: true, HTMLAttributes: { target: '_blank', rel: 'noreferrer' } },
      }),
      Image.configure({ allowBase64: false }),
      MdHardBreak,
      MdTaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: placeholder || '' }),
      Markdown.configure({ html: false, breaks: true, transformPastedText: true, transformCopiedText: true }),
    ],
    content: value || '',
    editorProps: {
      attributes: { class: 'rt-prose' },
      handlePaste: (view, event) => {
        const files = imagesFromClipboard(event)
        if (!files.length) return false
        event.preventDefault()
        insertFilesRef.current(files)
        return true
      },
      handleDrop: (view, event) => {
        const files = [...(event.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'))
        if (!files.length) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        insertFilesRef.current(files, pos)
        return true
      },
    },
    // Solo cambios hechos por el usuario: cargar el contenido inicial no reescribe la descripción
    onUpdate: ({ editor: ed }) => latest.current.onChange?.(ed.storage.markdown.getMarkdown()),
  })
  editorRef.current = editor

  useEffect(() => {
    onUploadingChange?.(uploading > 0)
  }, [uploading, onUploadingChange])

  // Esc cierra solo el modo expandido (sin llegar a cerrar el modal de la tarea)
  useEffect(() => {
    if (!expanded) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      setExpanded(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [expanded])

  if (!editor) return null

  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={(e) => {
        const files = [...e.target.files]
        e.target.value = ''
        if (files.length) insertFiles(files)
      }}
    />
  )

  return (
    <div data-rich-editor>
      {fileInput}
      <div className="relative rounded-lg border border-edge bg-raised transition focus-within:border-cyan/40 focus-within:ring-1 focus-within:ring-cyan/40">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          title="Ampliar: editor con formato e imágenes"
          aria-label="Ampliar editor"
          className="absolute right-1.5 top-1.5 z-10 rounded-md p-1.5 text-faint transition-colors hover:bg-surface hover:text-cyan"
        >
          <Maximize2 size={14} />
        </button>
        <div className="rt-compact max-h-56 min-h-[7.5rem] overflow-y-auto px-3 py-2 pr-9">
          {!expanded && <EditorContent editor={editor} />}
        </div>
      </div>

      {expanded &&
        createPortal(
          <div data-rich-editor className="fixed inset-0 z-[70] flex flex-col bg-base animate-fade-in">
            <header className="flex items-center gap-3 border-b border-edge bg-surface px-4 py-3">
              <div className="min-w-0 flex-1">
                <span className="eyebrow">&lt;descripción /&gt;</span>
                <h2 className="truncate font-display text-base font-semibold text-ink">{title || 'Descripción'}</h2>
              </div>
              {uploading > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Loader2 size={13} className="animate-spin" /> Subiendo imagen…
                </span>
              )}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="grad-accent flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white transition-shadow hover:shadow-glow"
              >
                <Minimize2 size={14} /> Listo
              </button>
            </header>
            <Toolbar editor={editor} uploading={uploading > 0} onPickImage={() => fileRef.current?.click()} />
            <div className="min-h-0 flex-1 cursor-text overflow-y-auto" onClick={() => editor.commands.focus()}>
              <div className="rt-page mx-auto min-h-full max-w-3xl px-6 py-8" onClick={(e) => e.stopPropagation()}>
                <EditorContent editor={editor} />
                <div className="h-[40vh] cursor-text" onClick={() => editor.commands.focus('end')} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
