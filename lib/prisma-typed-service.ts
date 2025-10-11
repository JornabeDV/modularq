import { supabase } from './supabase'
import type { User, Project, Task } from './generated/prisma'

// Servicio que usa Supabase pero con tipos de Prisma
export class PrismaTypedService {
  // Usuarios con tipos de Prisma
  static async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as User[]
  }

  static async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data as User
  }

  static async createUser(userData: {
    email: string
    name: string
    role: 'admin' | 'supervisor' | 'operario'
    password?: string
  }): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        password: userData.password,
        total_hours: 0,
        efficiency: 100
      })
      .select()
      .single()
    
    if (error) throw error
    return data as User
  }

  static async updateUser(id: string, userData: {
    email?: string
    name?: string
    role?: 'admin' | 'supervisor' | 'operario'
    password?: string
    total_hours?: number
    efficiency?: number
  }): Promise<User> {
    const updateData: any = {}
    
    if (userData.email !== undefined) updateData.email = userData.email
    if (userData.name !== undefined) updateData.name = userData.name
    if (userData.role !== undefined) updateData.role = userData.role
    if (userData.password !== undefined) updateData.password = userData.password
    if (userData.total_hours !== undefined) updateData.total_hours = userData.total_hours
    if (userData.efficiency !== undefined) updateData.efficiency = userData.efficiency

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as User
  }

  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Proyectos con tipos de Prisma
  static async getAllProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Project[]
  }

  static async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data as Project
  }

  static async createProject(projectData: {
    name: string
    description?: string
    status: 'planning' | 'active' | 'paused' | 'completed'
    start_date: Date
    end_date?: Date
    created_by?: string
  }): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        start_date: projectData.start_date.toISOString(),
        end_date: projectData.end_date?.toISOString(),
        created_by: projectData.created_by,
        progress: 0
      })
      .select()
      .single()
    
    if (error) throw error
    return data as Project
  }

  static async updateProject(id: string, projectData: {
    name?: string
    description?: string
    status?: 'planning' | 'active' | 'paused' | 'completed'
    start_date?: Date
    end_date?: Date
    progress?: number
  }): Promise<Project> {
    const updateData: any = {}
    
    if (projectData.name !== undefined) updateData.name = projectData.name
    if (projectData.description !== undefined) updateData.description = projectData.description
    if (projectData.status !== undefined) updateData.status = projectData.status
    if (projectData.start_date !== undefined) updateData.start_date = projectData.start_date.toISOString()
    if (projectData.end_date !== undefined) updateData.end_date = projectData.end_date.toISOString()
    if (projectData.progress !== undefined) updateData.progress = projectData.progress

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Project
  }

  static async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Tareas con tipos de Prisma
  static async getAllTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Task[]
  }

  static async getTasksByProject(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('project_tasks')
      .select(`
        *,
        task:tasks(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data.map(pt => pt.task).filter(Boolean) as Task[]
  }

  static async createTask(taskData: {
    title: string
    description?: string
    estimated_hours: number
    category?: string
    type: 'standard' | 'custom'
    created_by?: string
  }): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: taskData.title,
        description: taskData.description,
        estimated_hours: taskData.estimated_hours,
        category: taskData.category,
        type: taskData.type,
        created_by: taskData.created_by
      })
      .select()
      .single()
    
    if (error) throw error
    return data as Task
  }
}

// Exportar tipos de Prisma para uso en la aplicación
export type {
  User,
  Project,
  Task,
  TimeEntry,
  AuditLog,
  Report,
  ProjectOperario,
  UserRole,
  ProjectStatus,
  ProjectPriority,
  TaskStatus,
  TaskPriority,
  EntityType,
  ReportType
} from './generated/prisma'