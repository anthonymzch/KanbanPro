import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { COLUMNS, setTagColorOverrides } from '../lib/constants'
import { prepareImage } from '../lib/images'
import { extractImageUrls } from '../lib/richText'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const uid = user.uid

  const [prefs, setPrefs] = useState({
    theme: 'dark',
    exportPrompt: null,
    hiddenColumns: [],
    hiddenFilters: [],
    columnOrder: [],
    tagColors: {},
    cardMode: 'simple',
  })
  const [tasks, setTasks] = useState([])
  const [ideas, setIdeas] = useState([])
  const [projects, setProjects] = useState([])
  const [customColumns, setCustomColumns] = useState([])
  // Último order asignado por columna: evita duplicados si se crean
  // varias tareas antes de que llegue el snapshot con la anterior.
  const lastOrderRef = useRef({})

  // Suscripciones en tiempo real. Los writes locales llegan al instante
  // por la compensación de latencia de Firestore (optimistic UI).
  useEffect(() => {
    const unsubs = [
      onSnapshot(doc(db, 'users', uid), (snap) => {
        const d = snap.data()
        if (d) {
          // Antes del setPrefs para que el render ya vea los colores nuevos
          setTagColorOverrides(d.tagColors)
          setPrefs({
            theme: d.theme || 'dark',
            exportPrompt: d.exportPrompt ?? null,
            hiddenColumns: d.hiddenColumns ?? [],
            hiddenFilters: d.hiddenFilters ?? [],
            columnOrder: d.columnOrder ?? [],
            tagColors: d.tagColors ?? {},
            cardMode: d.cardMode || 'simple',
          })
        }
      }),
      onSnapshot(query(collection(db, 'users', uid, 'tasks'), orderBy('order')), (snap) => {
        setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }),
      onSnapshot(collection(db, 'users', uid, 'ideas'), (snap) => {
        setIdeas(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }),
      onSnapshot(query(collection(db, 'users', uid, 'projects'), orderBy('createdAt')), (snap) => {
        setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }),
      onSnapshot(query(collection(db, 'users', uid, 'columns'), orderBy('createdAt')), (snap) => {
        setCustomColumns(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }),
    ]
    return () => unsubs.forEach((u) => u())
  }, [uid])

  // Aplicar tema (oscuro por defecto)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', prefs.theme !== 'light')
  }, [prefs.theme])

  const value = useMemo(() => {
    const userRef = doc(db, 'users', uid)
    const tasksCol = collection(db, 'users', uid, 'tasks')
    const ideasCol = collection(db, 'users', uid, 'ideas')
    const projectsCol = collection(db, 'users', uid, 'projects')
    const columnsCol = collection(db, 'users', uid, 'columns')
    const fail = (err) => {
      console.error(err)
      toast('Error al guardar los cambios', 'error')
    }

    const nextOrder = (column) => {
      const orders = tasks.filter((t) => t.column === column).map((t) => t.order || 0)
      const order = Math.max(orders.length ? Math.max(...orders) : 0, lastOrderRef.current[column] || 0) + 1000
      lastOrderRef.current[column] = order
      return order
    }

    // Columnas del sistema + personalizadas, en el orden que guardó el usuario
    // (las que no estén en el orden guardado van al final).
    const baseColumns = [
      ...COLUMNS,
      ...customColumns.map((c) => ({ id: c.id, label: c.label, color: c.color, custom: true })),
    ]
    const order = prefs.columnOrder || []
    const columns = [
      ...order.map((id) => baseColumns.find((c) => c.id === id)).filter(Boolean),
      ...baseColumns.filter((c) => !order.includes(c.id)),
    ]

    return {
      prefs,
      tasks,
      ideas,
      projects,
      customColumns,
      columns,
      setColumnOrder: (columnOrder) => {
        setPrefs((p) => ({ ...p, columnOrder }))
        updateDoc(userRef, { columnOrder }).catch(fail)
      },
      // Migra las tareas indicadas a otra columna, al final y conservando su orden relativo
      moveTasksToColumn: (ids, column) => {
        const batch = writeBatch(db)
        const idSet = new Set(ids)
        tasks
          .filter((t) => idSet.has(t.id))
          .forEach((t) => {
            batch.update(doc(tasksCol, t.id), { column, order: nextOrder(column), updatedAt: serverTimestamp() })
          })
        batch.commit().catch(fail)
        const label = baseColumns.find((c) => c.id === column)?.label || column
        toast(`${ids.length} ${ids.length === 1 ? 'tarea movida' : 'tareas movidas'} a ${label}`)
      },

      setTheme: (theme) => {
        setPrefs((p) => ({ ...p, theme }))
        updateDoc(userRef, { theme }).catch(fail)
      },
      setExportPrompt: (exportPrompt) => {
        setPrefs((p) => ({ ...p, exportPrompt }))
        updateDoc(userRef, { exportPrompt }).catch(fail)
      },
      setHiddenColumns: (hiddenColumns) => {
        setPrefs((p) => ({ ...p, hiddenColumns }))
        updateDoc(userRef, { hiddenColumns }).catch(fail)
      },
      // Tipo de tarjeta al editar: 'simple' (detalles plegados) | 'project' (detalles a la vista)
      setCardMode: (cardMode) => {
        setPrefs((p) => ({ ...p, cardMode }))
        updateDoc(userRef, { cardMode }).catch(fail)
      },
      // Color elegido para una etiqueta (índice de TAG_PALETTE)
      setTagColor: (name, index) => {
        const tagColors = { ...prefs.tagColors, [name]: index }
        setTagColorOverrides(tagColors)
        setPrefs((p) => ({ ...p, tagColors }))
        updateDoc(userRef, { tagColors }).catch(fail)
      },
      setHiddenFilters: (hiddenFilters) => {
        setPrefs((p) => ({ ...p, hiddenFilters }))
        updateDoc(userRef, { hiddenFilters }).catch(fail)
      },

      addColumn: ({ label, color = 'blue' }) => {
        addDoc(columnsCol, { label, color, createdAt: serverTimestamp() }).catch(fail)
        toast('Columna creada')
      },
      updateColumn: (id, patch) => {
        updateDoc(doc(columnsCol, id), patch).catch(fail)
      },
      // Borra la columna y sus tareas vuelven al Backlog
      deleteColumn: (id) => {
        const batch = writeBatch(db)
        batch.delete(doc(columnsCol, id))
        tasks.filter((t) => t.column === id).forEach((t) => batch.update(doc(tasksCol, t.id), { column: 'backlog' }))
        batch.commit().catch(fail)
        toast('Columna eliminada')
      },

      addProject: ({ name, color = 'blue' }) => {
        addDoc(projectsCol, { name, color, createdAt: serverTimestamp() }).catch(fail)
        toast('Proyecto creado')
      },
      updateProject: (id, patch) => {
        updateDoc(doc(projectsCol, id), patch).catch(fail)
        toast('Proyecto actualizado')
      },
      // Borra el proyecto y desasigna sus tareas e ideas (quedan sin proyecto)
      deleteProject: (id) => {
        const batch = writeBatch(db)
        batch.delete(doc(projectsCol, id))
        tasks.filter((t) => t.projectId === id).forEach((t) => batch.update(doc(tasksCol, t.id), { projectId: null }))
        ideas.filter((i) => i.projectId === id).forEach((i) => batch.update(doc(ideasCol, i.id), { projectId: null }))
        batch.commit().catch(fail)
        toast('Proyecto eliminado')
      },

      addTask: ({
        title,
        column = 'backlog',
        description = '',
        tags = [],
        subtasks = [],
        priority = 'media',
        dueDate = null,
        projectId = null,
      }) => {
        const taskRef = doc(tasksCol)
        setDoc(taskRef, {
          title,
          description,
          column,
          tags,
          subtasks,
          priority,
          dueDate,
          projectId,
          order: nextOrder(column),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(fail)
        toast('Tarea creada')
        return taskRef.id
      },
      updateTask: (id, patch, { silent = false } = {}) => {
        updateDoc(doc(tasksCol, id), { ...patch, updatedAt: serverTimestamp() }).catch(fail)
        if (!silent) toast('Tarea actualizada')
      },
      deleteTask: (id) => {
        const t = tasks.find((x) => x.id === id)
        deleteDoc(doc(tasksCol, id)).catch(fail)
        // Limpia sus capturas del Storage (mejor esfuerzo: si falla no bloquea el borrado)
        ;[...(t?.images || []), ...(t?.correctionImages || []), ...extractImageUrls(t?.description)].forEach((url) =>
          deleteObject(storageRef(storage, url)).catch(() => {})
        )
        toast('Tarea eliminada')
      },
      moveTask: (id, column, order) => {
        updateDoc(doc(tasksCol, id), { column, order, updatedAt: serverTimestamp() }).catch(fail)
      },
      // Manda una tarea al final de otra columna (sin aviso: la tarjeta se ve moverse)
      sendTaskToColumn: (id, column) => {
        updateDoc(doc(tasksCol, id), { column, order: nextOrder(column), updatedAt: serverTimestamp() }).catch(fail)
      },
      markTaskDone: (id) => {
        updateDoc(doc(tasksCol, id), { column: 'done', order: nextOrder('done'), updatedAt: serverTimestamp() }).catch(fail)
        toast('Tarea completada 🎉')
      },
      // Manda de una vez las tareas indicadas a Revisión, cada una con su propia nota
      // (items: [{ id, note }])
      sendToReview: (items) => {
        const batch = writeBatch(db)
        items.forEach(({ id, note }) => {
          batch.update(doc(tasksCol, id), {
            column: 'review',
            order: nextOrder('review'),
            reviewNote: note,
            reviewStatus: null,
            correctionNote: null,
            updatedAt: serverTimestamp(),
          })
        })
        batch.commit().catch(fail)
        toast(`${items.length} ${items.length === 1 ? 'tarea enviada' : 'tareas enviadas'} a revisión`)
      },
      // Sube capturas de pantalla y las adjunta a un campo de imágenes de la tarea:
      // 'images' (contexto de la tarjeta) o 'correctionImages' (correcciones de Revisión).
      // Todo o nada: si alguna subida falla no se guarda ninguna URL.
      addTaskImages: async (taskId, files, field = 'images') => {
        try {
          const folder = field === 'images' ? 'images' : 'corrections'
          const urls = await Promise.all(
            files.map(async (original) => {
              const file = await prepareImage(original)
              const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
              const fileRef = storageRef(storage, `users/${uid}/tasks/${taskId}/${folder}/${crypto.randomUUID()}.${ext}`)
              await uploadBytes(fileRef, file, { contentType: file.type })
              return getDownloadURL(fileRef)
            })
          )
          await updateDoc(doc(tasksCol, taskId), { [field]: arrayUnion(...urls), updatedAt: serverTimestamp() })
          return true
        } catch (err) {
          fail(err)
          return false
        }
      },
      removeTaskImages: async (taskId, urls, field = 'images') => {
        try {
          await updateDoc(doc(tasksCol, taskId), { [field]: arrayRemove(...urls), updatedAt: serverTimestamp() })
          await Promise.all(urls.map((url) => deleteObject(storageRef(storage, url)).catch(() => {})))
          return true
        } catch (err) {
          fail(err)
          return false
        }
      },
      // Sube una imagen para incrustarla en una descripción (devuelve su URL, o null si falla)
      uploadInlineImage: async (file) => {
        try {
          const prepared = await prepareImage(file)
          const ext = (prepared.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
          const fileRef = storageRef(storage, `users/${uid}/inline/${crypto.randomUUID()}.${ext}`)
          await uploadBytes(fileRef, prepared, { contentType: prepared.type })
          return await getDownloadURL(fileRef)
        } catch (err) {
          fail(err)
          return null
        }
      },
      // Borra archivos de Storage por URL (mejor esfuerzo)
      deleteImagesByUrl: (urls) => {
        urls.forEach((url) => deleteObject(storageRef(storage, url)).catch(() => {}))
      },
      addCorrectionImage: (taskId, file) => value.addTaskImages(taskId, [file], 'correctionImages'),
      removeCorrectionImage: (taskId, url) => value.removeTaskImages(taskId, [url], 'correctionImages'),

      addIdea: ({ title, description = '', category = 'nueva-app', projectId = null }) => {
        addDoc(ideasCol, {
          title,
          description,
          category,
          projectId,
          votes: 0,
          status: 'nueva',
          convertedTaskId: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(fail)
        toast('Idea guardada')
      },
      updateIdea: (id, patch, { silent = false } = {}) => {
        updateDoc(doc(ideasCol, id), { ...patch, updatedAt: serverTimestamp() }).catch(fail)
        if (!silent) toast('Idea actualizada')
      },
      deleteIdea: (id) => {
        deleteDoc(doc(ideasCol, id)).catch(fail)
        toast('Idea eliminada')
      },
      voteIdea: (id) => {
        updateDoc(doc(ideasCol, id), { votes: increment(1), updatedAt: serverTimestamp() }).catch(fail)
      },
      // Idea aprobada → tarea nueva al final del Backlog (batch atómico)
      convertIdea: (idea) => {
        const taskRef = doc(tasksCol)
        const batch = writeBatch(db)
        batch.set(taskRef, {
          title: idea.title,
          description: idea.description || '',
          column: 'backlog',
          tags: ['idea'],
          priority: 'media',
          dueDate: null,
          projectId: idea.projectId || null,
          order: nextOrder('backlog'),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        batch.update(doc(ideasCol, idea.id), {
          convertedTaskId: taskRef.id,
          updatedAt: serverTimestamp(),
        })
        batch.commit().catch(fail)
        toast('Idea enviada al Backlog 🚀')
      },
    }
  }, [uid, prefs, tasks, ideas, projects, customColumns, toast])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)
