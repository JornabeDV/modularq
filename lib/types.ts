export interface Project {
  id: string
  name: string
  description: string
  status: "planning" | "active" | "paused" | "completed" | "delivered" | "rented"
  condition: "alquiler" | "venta"
  startDate?: string
  endDate?: string
  supervisor?: string
  budget?: number
  progress?: number
  projectOrder?: number
  createdBy: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  deliveredAt?: string
  clientId?: string
  quoteId?: string
  quote?: {
    id: string
    number: string
    quoteType: string
    status: string
    clientName: string
    total: number
    totalArs?: number | null
    currency?: string
    exchangeRate?: number
    pdfUrl?: string
  }
  client?: {
    id: string
    cuit: string
    companyName: string
    representative: string
    email: string
    phone: string
  }
  // Especificaciones técnicas
  modulation: string
  height: number
  width: number
  depth: number
  moduleCount: number
  projectTasks: ProjectTask[]
  projectOperarios: ProjectOperario[]
}

export interface ProjectOperario {
  id: string
  projectId: string
  userId: string
  assignedAt: string
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
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  estimatedHours: number  // Tiempo estimado total para este proyecto (task.estimatedHours * project.moduleCount)
  actualHours: number
  assignedTo?: string
  startDate?: string
  endDate?: string
  progressPercentage: number
  notes?: string
  assignedAt: string
  createdAt: string
  updatedAt: string
  taskOrder: number
  // Campos de tracking de estado
  startedBy?: string
  startedAt?: string
  completedBy?: string
  completedAt?: string
  // Relaciones
  task?: Task
  assignedUser?: { id: string; name: string; role: string }
  startedByUser?: { id: string; name: string; role: string }
  completedByUser?: { id: string; name: string; role: string }
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
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
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

// ==================== RENTAL MODULES & CONTRACTS ====================

export interface RentalModule {
  id: string
  code: string
  name: string
  description?: string
  project_id?: string
  project?: {
    id: string
    name: string
    status?: string
    client?: {
      id: string
      company_name: string
    }
  }
  modulation: string
  height: number
  width: number
  depth: number
  module_count: number
  status: "available" | "rented" | "maintenance" | "retired"
  location: "factory" | "destination"
  condition?: string
  notes?: string
  current_contract_id?: string
  current_contract?: RentalContract
  contracts?: RentalContract[]
  created_at: string
  updated_at: string
}

export interface RentalContract {
  id: string
  rental_module_id: string
  rental_module?: {
    id: string
    code: string
    name: string
  }
  client_id: string
  client?: {
    id: string
    company_name: string
    representative?: string
    phone?: string
    email?: string
    cuit?: string
  }
  quote_id?: string
  quote?: {
    id: string
    number: string
    total: number
    currency?: string
  }
  start_date: string
  end_date?: string
  delivery_date?: string
  return_date?: string
  monthly_price: number
  deposit_amount?: number
  currency: string
  status: "active" | "returned" | "overdue" | "cancelled"
  delivery_notes?: string
  return_notes?: string
  created_by: string
  created_by_user?: {
    id: string
    name: string
  }
  created_at: string
  updated_at: string
}