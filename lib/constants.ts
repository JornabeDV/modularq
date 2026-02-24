// Constantes del sistema

// Categorías de tareas
export const TASK_CATEGORIES = [
  'Estructura',
  'Pintura',
  'Paneles',
  'Carpintería',
  'Zinguerías',
  'Instalaciones',
  'Acabados',
  'Finalización',
  'Mobiliario'
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
  { value: 'in_progress', label: 'En Progreso', color: 'default' },
  { value: 'completed', label: 'Completada', color: 'success' },
  { value: 'cancelled', label: 'Cancelada', color: 'destructive' }
] as const

export type TaskStatus = typeof TASK_STATUSES[number]['value']

// Unidades de medida para presupuestos y materiales
export const UNIT_LABELS: Record<string, string> = {
  unidad: 'u',
  metro: 'm',
  metro_cuadrado: 'm²',
  metro_cubico: 'm³',
  kilogramo: 'kg',
  litro: 'lt',
  global: 'gl',
}

// Estados de presupuestos
export const BUDGET_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}

export const BUDGET_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500',
  sent: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
}
