// Constantes del sistema

// Categorías de tareas
export const TASK_CATEGORIES = [
  'Instalación',
  'Calidad',
  'Mantenimiento',
  'Producción',
  'Logística',
  'Seguridad',
  'Administrativo',
  'Investigación'
] as const

export type TaskCategory = typeof TASK_CATEGORIES[number]

// Prioridades de tareas
export const TASK_PRIORITIES = [
  { value: 'low', label: 'Baja', color: 'secondary' as const },
  { value: 'medium', label: 'Media', color: 'default' as const },
  { value: 'high', label: 'Alta', color: 'destructive' as const },
  { value: 'critical', label: 'Crítica', color: 'destructive' as const }
] as const

export type TaskPriority = typeof TASK_PRIORITIES[number]['value']

// Estados de tareas
export const TASK_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: 'secondary' },
  { value: 'in-progress', label: 'En Progreso', color: 'default' },
  { value: 'completed', label: 'Completada', color: 'success' },
  { value: 'blocked', label: 'Bloqueada', color: 'destructive' }
] as const

export type TaskStatus = typeof TASK_STATUSES[number]['value']
