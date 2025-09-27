export interface Project {
  id: string
  name: string
  description: string
  status: "planning" | "active" | "paused" | "completed"
  priority: "low" | "medium" | "high" | "critical"
  startDate: string
  endDate?: string
  progress: number
  assignedOperarios: string[]
  supervisor: string
  department: string
  budget?: number
  tasks: Task[]
}

export interface Task {
  id: string
  projectId?: string
  title: string
  description: string
  assignedTo?: string
  assignedUsers?: Array<{ id: string; name: string; role: string }>
  estimatedHours: number
  actualHours: number
  startDate?: string
  endDate?: string
  dependencies?: string[]
  category: string
  skills?: string[]
  isTemplate: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Operario {
  id: string
  name: string
  email: string
  department: string
  skills: string[]
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