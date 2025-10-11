export interface Project {
  id: string
  name: string
  description: string
  status: "planning" | "active" | "paused" | "completed"
  startDate?: string
  endDate?: string
  supervisor?: string
  budget?: number
  progress?: number
  createdBy: string
  createdAt: string
  updatedAt: string
  projectTasks: ProjectTask[]
  projectOperarios: ProjectOperario[]
}

export interface ProjectOperario {
  id: string
  projectId: string
  userId: string
  assignedAt: string
  assignedBy?: string
  // Relaciones
  user?: { id: string; name: string; role: string }
}

// Tarea base (solo información, sin evolución)
export interface Task {
  id: string
  title: string
  description: string
  category: string
  type: 'standard' | 'custom'
  estimatedHours: number
  taskOrder: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

// Evolución de tarea en un proyecto específico
export interface ProjectTask {
  id: string
  projectId: string
  taskId: string
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  actualHours: number
  assignedTo?: string
  startDate?: string
  endDate?: string
  progressPercentage: number
  notes?: string
  assignedAt: string
  assignedBy?: string
  createdAt: string
  updatedAt: string
  taskOrder: number
  // Relaciones
  task?: Task
  assignedUser?: { id: string; name: string; role: string }
  collaborators?: TaskCollaborator[]
}

// Colaboradores de una tarea
export interface TaskCollaborator {
  id: string
  projectTaskId: string
  userId: string
  addedBy: string
  addedAt: string
  createdAt: string
  updatedAt: string
  // Relaciones
  user?: { id: string; name: string; role: string }
  addedByUser?: { id: string; name: string; role: string }
}

// Para compatibilidad con componentes existentes
export interface TaskWithProject extends Task {
  projectId: string
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  assignedTo?: string
  assignedUsers?: Array<{ id: string; name: string; role: string }>
  actualHours: number
  startDate?: string
  endDate?: string
  dependencies?: string[]
}

export interface Operario {
  id: string
  name: string
  email: string
  role: string
  currentTasks: string[]
  totalHours: number
  efficiency: number
}

export interface TimeEntry {
  id: string
  operarioId: string
  taskId: string
  projectId: string
  startTime: string
  endTime?: string
  hours: number
  description: string
  date: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entityType: "project" | "task" | "operario" | "time-entry"
  entityId: string
  entityName: string
  changes?: Record<string, { from: any; to: any }>
  timestamp: string
  ipAddress?: string
}

export interface Report {
  id: string
  name: string
  type: "productivity" | "time-tracking" | "project-status" | "operario-performance"
  description: string
  generatedBy: string
  generatedAt: string
  parameters: Record<string, any>
  data: any
}