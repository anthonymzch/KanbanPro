import { TaskList } from '@tiptap/extension-list'
import HardBreak from '@tiptap/extension-hard-break'
import taskListPlugin from 'markdown-it-task-lists'

// Ajustes a cómo `tiptap-markdown` escribe el Markdown, para que la descripción
// sea limpia y se lea igual al volver a abrirla.

// Las listas de tareas usan `*` (y las de viñetas `-`): con el mismo marcador,
// markdown-it fundía una lista de viñetas y otra de tareas contiguas en una sola
// y aparecía un item vacío. Además salen compactas (sin línea en blanco entre items).
export const MdTaskList = TaskList.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          const prev = state.options.tightLists
          state.options.tightLists = true
          try {
            return state.renderList(node, '  ', () => '* ')
          } finally {
            state.options.tightLists = prev
          }
        },
        parse: {
          setup(markdownit) {
            markdownit.use(taskListPlugin)
          },
          updateDOM(element) {
            element.querySelectorAll('.contains-task-list').forEach((list) => list.setAttribute('data-type', 'taskList'))
          },
        },
      },
    }
  },
})

// Salto de línea simple en lugar de `\` + salto: con `breaks: true` se vuelve a
// leer como <br>, y en el texto (que también lee Claude) no queda la barra.
export const MdHardBreak = HardBreak.extend({
  addStorage() {
    return {
      markdown: {
        serialize(state, node, parent, index) {
          for (let i = index + 1; i < parent.childCount; i++) {
            if (parent.child(i).type !== node.type) {
              state.write('\n')
              return
            }
          }
        },
        parse: {},
      },
    }
  },
})
