# KanbanPro

Gestión de trabajo tipo kanban + lluvia de ideas. Herramienta personal con arquitectura lista para SaaS multi-usuario (todos los datos cuelgan de `users/{userId}` y las reglas de Firestore aíslan a cada usuario).

## Stack

- React 18 + Vite + Tailwind CSS 3 (tema oscuro por defecto, `darkMode: 'class'`)
- Firebase: Auth (Google + email/contraseña), Firestore, Hosting — proyecto `kanbanpro-anthony`
- `@dnd-kit/core` + `@dnd-kit/sortable` para drag & drop
- `lucide-react` (iconos), `canvas-confetti`
- TipTap v3 + `tiptap-markdown` (editor de descripciones)

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

- `users/{uid}` — `email, displayName, theme ('dark'|'light'), createdAt`
- `users/{uid}/projects/{id}` — `name, color (clave de PROJECT_COLORS), createdAt`
- `users/{uid}/tasks/{id}` — `title, description, column, order (float), tags[], priority (baja|media|alta|urgente), dueDate ('YYYY-MM-DD'|null), projectId (string|null), images[] (URLs de capturas de contexto), correctionImages[] (capturas de correcciones en Revisión), createdAt, updatedAt`
- `users/{uid}/ideas/{id}` — `title, description, category ('nueva-app'|'mejora'), votes, status (nueva|evaluacion|aprobada|descartada), projectId (string|null), convertedTaskId, createdAt, updatedAt`

### Decisiones clave

- **Orden de tarjetas**: campo `order` fraccionario — mover una tarjeta escribe solo ese documento (`(prev+next)/2`, extremos ±1000).
- **Drag & drop**: `BoardPage` mantiene una copia local `cols` (mapa columna→ids) que se muta en `onDragOver` para animar entre columnas y se persiste en `onDragEnd`. Se reconstruye desde el snapshot cuando no hay drag activo.
- **Filtros** (búsqueda/prioridad/etiqueta) se aplican en cliente sobre el snapshot en memoria.
- Convertir idea → tarea usa un `writeBatch` atómico (crea task en Backlog + marca `convertedTaskId`); hereda el `projectId` de la idea.
- **Capturas por tarjeta**: `TaskModal` permite adjuntar hasta 10 imágenes (botón, Ctrl+V o arrastrar). Los cambios quedan en estado local hasta pulsar Guardar; `addTaskImages`/`removeTaskImages` (useStore) suben a Firebase Storage (`users/{uid}/tasks/{id}/images/`, reglas en `storage.rules`), reescalan con `lib/images.js` si pesan >1 MB y guardan las URLs con `arrayUnion`/`arrayRemove`. Las URLs salen en el export de columna y en "copiar tarjeta" para que el prompt para Claude las incluya. `deleteTask` borra también los archivos.
- **Descripción con formato**: `RichTextEditor` (TipTap + `tiptap-markdown`) reemplaza al textarea de `TaskModal`. Caja compacta con botón para ampliar a un editor de pantalla completa (barra de formato, imágenes incrustadas). Se guarda como **Markdown** en `description` (las tareas antiguas en texto plano siguen siendo válidas y el export para Claude sigue siendo texto). Las imágenes se suben a `users/{uid}/inline/` (`uploadInlineImage`) y quedan como `![](url)`; las no usadas se borran al guardar/cancelar, y `deleteTask` borra las de su descripción. `lib/markdownExtensions.js` ajusta la serialización (listas de tareas con `*` para que no se fundan con listas de viñetas; saltos de línea sin `\`).
- **Sidebar plegable**: `sidebarCollapsed` en `useUI` (persistido en localStorage, atajo Ctrl/Cmd+B); botón en el sidebar para esconderlo y en `TopBar` para volver a mostrarlo.
- **Proyectos**: agrupan tarjetas (franja + chip de color en la tarjeta, lista clicable en el sidebar que filtra el tablero, select en filtros/modales, gestión CRUD en `ProjectsModal`). Borrar un proyecto desasigna sus tareas/ideas en batch, no las borra. QuickAdd y el modal de tarea nueva heredan el proyecto del filtro activo.

## Diseño

Identidad "Anthony Code": fondo `#0A0E16`, gradientes azul eléctrico→cian→violeta (`.grad-accent`, `.grad-text`), Space Grotesk (títulos) / Inter (texto) / JetBrains Mono (detalles), eyebrows estilo `<tablero />`. Colores semánticos vía variables CSS (`--c-base`, `--c-surface`…) mapeadas en Tailwind (`bg-base`, `text-ink`, `border-edge`…) para soportar tema claro/oscuro.
