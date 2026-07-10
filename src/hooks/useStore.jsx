import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const uid = user.uid

  const [prefs, setPrefs] = useState({ theme: 'dark', wipLimit: null })
  const [tasks, setTasks] = useState([])
  const [ideas, setIdeas] = useState([])
  const [projects, setProjects] = useState([])
  // Último order asignado por columna: evita duplicados si se crean
  // varias tareas antes de que llegue el snapshot con la anterior.
  const lastOrderRef = useRef({})

  // Suscripciones en tiempo real. Los writes locales llegan al instante
  // por la compensación de latencia de Firestore (optimistic UI).
  useEffect(() => {
    const unsubs = [
      onSnapshot(doc(db, 'users', uid), (snap) => {
        const d = snap.data()
        if (d) setPrefs({ theme: d.theme || 'dark', wipLimit: d.wipLimit ?? null })
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

    return {
      prefs,
      tasks,
      ideas,
      projects,

      setTheme: (theme) => {
        setPrefs((p) => ({ ...p, theme }))
        updateDoc(userRef, { theme }).catch(fail)
      },
      setWipLimit: (wipLimit) => {
        setPrefs((p) => ({ ...p, wipLimit }))
        updateDoc(userRef, { wipLimit }).catch(fail)
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
        addDoc(tasksCol, {
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
      },
      updateTask: (id, patch, { silent = false } = {}) => {
        updateDoc(doc(tasksCol, id), { ...patch, updatedAt: serverTimestamp() }).catch(fail)
        if (!silent) toast('Tarea actualizada')
      },
      deleteTask: (id) => {
        deleteDoc(doc(tasksCol, id)).catch(fail)
        toast('Tarea eliminada')
      },
      moveTask: (id, column, order) => {
        updateDoc(doc(tasksCol, id), { column, order, updatedAt: serverTimestamp() }).catch(fail)
      },

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
  }, [uid, prefs, tasks, ideas, projects, toast])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)
