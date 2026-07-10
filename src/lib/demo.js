import { signInWithEmailAndPassword } from 'firebase/auth'
import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from './firebase'

// Cuenta demo pública para visitantes del portafolio. Si alguien borra los
// datos, se resiembran solos en la siguiente entrada a la demo.
export const DEMO_EMAIL = 'demo.kanbanpro@example.com'
const DEMO_PASSWORD = 'demo-kanbanpro-2026'

const daysFromNow = (n) => {
  const d = new Date(Date.now() + n * 86400000)
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export async function enterDemo() {
  const cred = await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD)
  const uid = cred.user.uid
  const tasksCol = collection(db, 'users', uid, 'tasks')
  const existing = await getDocs(tasksCol)
  if (!existing.empty) return

  const batch = writeBatch(db)
  const projectsCol = collection(db, 'users', uid, 'projects')
  const ideasCol = collection(db, 'users', uid, 'ideas')
  const now = serverTimestamp()

  const mkProject = (name, color) => {
    const ref = doc(projectsCol)
    batch.set(ref, { name, color, createdAt: now })
    return ref.id
  }
  const redes = mkProject('Redes Sociales', 'rose')
  const movil = mkProject('App Móvil', 'cyan')
  const portfolio = mkProject('Portfolio Web', 'violet')

  const orders = {}
  const mkTask = (column, title, opts = {}) => {
    orders[column] = (orders[column] || 0) + 1000
    batch.set(doc(tasksCol), {
      title,
      description: opts.description || '',
      column,
      order: orders[column],
      tags: opts.tags || [],
      priority: opts.priority || 'media',
      dueDate: opts.dueDate || null,
      projectId: opts.projectId || null,
      createdAt: now,
      updatedAt: now,
    })
  }

  mkTask('backlog', 'Guion para el próximo reel', { projectId: redes, tags: ['contenido'], priority: 'baja' })
  mkTask('backlog', 'Diseñar pantalla de onboarding', { projectId: movil, tags: ['diseño'] })
  mkTask('backlog', 'Investigar animaciones con Framer Motion', { projectId: portfolio, tags: ['investigación'], priority: 'baja' })
  mkTask('todo', 'Calendario de publicaciones de julio', { projectId: redes, priority: 'alta', dueDate: daysFromNow(1), tags: ['contenido'] })
  mkTask('todo', 'Actualizar sección de proyectos', {
    projectId: portfolio,
    priority: 'alta',
    dueDate: daysFromNow(-1),
    description: 'Añadir KanbanPro con capturas y link a la demo.',
  })
  mkTask('todo', 'Configurar deep links', { projectId: movil, tags: ['config'] })
  mkTask('inprogress', 'Editar video del tutorial', { projectId: redes, priority: 'urgente', dueDate: daysFromNow(2), tags: ['contenido', 'video'] })
  mkTask('inprogress', 'Integrar notificaciones push', { projectId: movil, priority: 'alta', tags: ['firebase'] })
  mkTask('done', 'Definir paleta de colores', { projectId: portfolio, tags: ['diseño'] })
  mkTask('done', 'Publicar post de lanzamiento', { projectId: redes, tags: ['contenido'] })
  mkTask('archived', 'Migrar cuentas antiguas', { description: 'Se resolvió con el script de importación.' })

  const mkIdea = (title, opts = {}) => {
    batch.set(doc(ideasCol), {
      title,
      description: opts.description || '',
      category: opts.category || 'nueva-app',
      votes: opts.votes || 0,
      status: opts.status || 'nueva',
      projectId: opts.projectId || null,
      convertedTaskId: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  mkIdea('Plantillas de tableros predefinidas', {
    category: 'mejora',
    votes: 15,
    status: 'aprobada',
    description: 'Tableros de ejemplo para sprint, contenido y estudio.',
  })
  mkIdea('App de hábitos con gamificación', {
    category: 'nueva-app',
    votes: 12,
    status: 'evaluacion',
    description: 'Rachas, niveles y recompensas por constancia.',
  })
  mkIdea('Modo colaborativo en tiempo real', { category: 'mejora', votes: 8, projectId: movil })
  mkIdea('Generador de threads con IA', { category: 'nueva-app', votes: 3, status: 'descartada', projectId: redes })

  await batch.commit()
}
