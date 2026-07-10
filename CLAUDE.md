# KanbanPro

Gestión de trabajo tipo kanban + lluvia de ideas. Herramienta personal con arquitectura lista para SaaS multi-usuario (todos los datos cuelgan de `users/{userId}` y las reglas de Firestore aíslan a cada usuario).

## Stack

- React 18 + Vite + Tailwind CSS 3 (tema oscuro por defecto, `darkMode: 'class'`)
- Firebase: Auth (Google + email/contraseña), Firestore, Hosting — proyecto `kanbanpro-anthony`
- `@dnd-kit/core` + `@dnd-kit/sortable` para drag & drop
- `lucide-react` (iconos), `canvas-confetti`

## Comandos

```bash
npm run dev       # dev server en http://localhost:5174 (strictPort)
npm run build     # build de producción en dist/
npm run deploy    # build + firebase deploy (hosting + reglas firestore)
```

## Arquitectura

- `src/lib/firebase.js` — init de Firebase (auth, db, provider de Google)
- `src/lib/constants.js` — columnas, prioridades, categorías/estados de idea, paleta de etiquetas
- `src/hooks/useAuth.jsx` — sesión; crea `users/{uid}` en el primer login
- `src/hooks/useStore.jsx` — suscripciones `onSnapshot` a prefs/tasks/ideas + todas las operaciones de escritura. La UI optimista sale gratis por la compensación de latencia de Firestore. Aplica el tema al `<html>`.
- `src/hooks/useUI.jsx` — modales, command palette, filtros del tablero y atajos globales (N tarea, I idea, `/` buscar, Ctrl/Cmd+K paleta)
- `src/pages/` — LoginPage, BoardPage (kanban), IdeasPage
- `src/components/board/` — Column, TaskCard, TaskModal, QuickAdd, FilterBar
- `src/components/ideas/` — IdeaCard, IdeaFormModal
- `src/components/layout/` — AppShell (renderiza modales globales), Sidebar, TopBar
- `src/components/ui/` — Modal, ConfirmDialog, Badge, EmptyState, CommandPalette; toasts en `useToast.jsx`

### Modelo de datos (Firestore)

- `users/{uid}` — `email, displayName, theme ('dark'|'light'), wipLimit (number|null), createdAt`
- `users/{uid}/projects/{id}` — `name, color (clave de PROJECT_COLORS), createdAt`
- `users/{uid}/tasks/{id}` — `title, description, column, order (float), tags[], priority (baja|media|alta|urgente), dueDate ('YYYY-MM-DD'|null), projectId (string|null), createdAt, updatedAt`
- `users/{uid}/ideas/{id}` — `title, description, category ('nueva-app'|'mejora'), votes, status (nueva|evaluacion|aprobada|descartada), projectId (string|null), convertedTaskId, createdAt, updatedAt`

### Decisiones clave

- **Orden de tarjetas**: campo `order` fraccionario — mover una tarjeta escribe solo ese documento (`(prev+next)/2`, extremos ±1000).
- **Drag & drop**: `BoardPage` mantiene una copia local `cols` (mapa columna→ids) que se muta en `onDragOver` para animar entre columnas y se persiste en `onDragEnd`. Se reconstruye desde el snapshot cuando no hay drag activo.
- **Filtros** (búsqueda/prioridad/etiqueta) se aplican en cliente sobre el snapshot en memoria.
- Convertir idea → tarea usa un `writeBatch` atómico (crea task en Backlog + marca `convertedTaskId`); hereda el `projectId` de la idea.
- **Proyectos**: agrupan tarjetas (franja + chip de color en la tarjeta, lista clicable en el sidebar que filtra el tablero, select en filtros/modales, gestión CRUD en `ProjectsModal`). Borrar un proyecto desasigna sus tareas/ideas en batch, no las borra. QuickAdd y el modal de tarea nueva heredan el proyecto del filtro activo.

## Diseño

Identidad "Anthony Code": fondo `#0A0E16`, gradientes azul eléctrico→cian→violeta (`.grad-accent`, `.grad-text`), Space Grotesk (títulos) / Inter (texto) / JetBrains Mono (detalles), eyebrows estilo `<tablero />`. Colores semánticos vía variables CSS (`--c-base`, `--c-surface`…) mapeadas en Tailwind (`bg-base`, `text-ink`, `border-edge`…) para soportar tema claro/oscuro.
