import { supabase } from './supabase'
import type { User, Project, Task } from './generated/prisma/index'

export class PrismaTypedService {
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
    if (userData.password !== undefined && userData.password.trim() !== '') {
      updateData.password = userData.password
    }
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

  static async getAllProjects(): Promise<any[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients!client_id (
          id,
          cuit,
          company_name,
          representative,
          email,
          phone
        ),
        project_tasks (
          id,
          project_id,
          task_id,
          status,
          actual_hours,
          assigned_to,
          start_date,
          end_date,
          progress_percentage,
          notes,
          assigned_at,
          started_by,
          started_at,
          completed_by,
          completed_at,
          created_at,
          updated_at,
          task:task_id (
            id,
            title,
            description,
            category,
            type,
            estimated_hours,
            created_by,
            created_at,
            updated_at
          ),
          assigned_user:assigned_to (
            id,
            name,
            role
          ),
          started_by_user:started_by (
            id,
            name,
            role
          ),
          completed_by_user:completed_by (
            id,
            name,
            role
          )
        ),
        project_operarios (
          id,
          project_id,
          user_id,
          assigned_at,
          user:user_id (
            id,
            name,
            role
          )
        )
      `)
      .order('project_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
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
    status: 'planning' | 'active' | 'paused' | 'completed' | 'delivered'
    condition?: 'alquiler' | 'venta'
    start_date: Date
    end_date?: Date
    client_id?: string
    created_by?: string
    modulation?: string
    height?: number
    width?: number
    depth?: number
    module_count?: number
  }): Promise<any> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        condition: projectData.condition || 'venta',
        start_date: projectData.start_date.toISOString(),
        end_date: projectData.end_date?.toISOString(),
        client_id: projectData.client_id,
        created_by: projectData.created_by,
        progress: 0,
        modulation: projectData.modulation || 'standard',
        height: projectData.height || 2.0,
        width: projectData.width || 1.5,
        depth: projectData.depth || 0.8,
        module_count: projectData.module_count || 1
      })
      .select()
      .single()
    
    if (error) throw error
    return data as any
  }

  static async updateProject(id: string, projectData: {
    name?: string
    description?: string
    status?: 'planning' | 'active' | 'paused' | 'completed' | 'delivered'
    condition?: 'alquiler' | 'venta'
    start_date?: Date
    end_date?: Date
    client_id?: string
    progress?: number
    project_order?: number
    modulation?: string
    height?: number
    width?: number
    depth?: number
    module_count?: number
  }): Promise<any> {
    const updateData: any = {}
    
    if (projectData.name !== undefined) updateData.name = projectData.name
    if (projectData.description !== undefined) updateData.description = projectData.description
    if (projectData.status !== undefined) updateData.status = projectData.status
    if (projectData.condition !== undefined) updateData.condition = projectData.condition
    if (projectData.start_date !== undefined) updateData.start_date = projectData.start_date.toISOString()
    if (projectData.end_date !== undefined) updateData.end_date = projectData.end_date.toISOString()
    if (projectData.client_id !== undefined) updateData.client_id = projectData.client_id
    if (projectData.progress !== undefined) updateData.progress = projectData.progress
    if (projectData.project_order !== undefined) updateData.project_order = projectData.project_order
    if (projectData.modulation !== undefined) updateData.modulation = projectData.modulation
    if (projectData.height !== undefined) updateData.height = projectData.height
    if (projectData.width !== undefined) updateData.width = projectData.width
    if (projectData.depth !== undefined) updateData.depth = projectData.depth
    if (projectData.module_count !== undefined) updateData.module_count = projectData.module_count

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as any
  }

  static async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

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
    return data.map((pt: any) => pt.task).filter(Boolean) as Task[]
  }

  static async createTask(taskData: {
    title: string
    description?: string
    estimated_hours: number
    category?: string
    type: 'standard' | 'custom'
    created_by?: string
  }): Promise<Task> {
    const { data: maxOrderData } = await supabase
      .from('tasks')
      .select('task_order')
      .order('task_order', { ascending: false })
      .limit(1)
      .single()
    
    const nextOrder = (maxOrderData?.task_order || 0) + 1

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: taskData.title,
        description: taskData.description,
        estimated_hours: taskData.estimated_hours,
        category: taskData.category,
        type: taskData.type,
        task_order: nextOrder,
        created_by: taskData.created_by
      })
      .select()
      .single()
    
    if (error) throw error
    return data as Task
  }

  static async updateTask(id: string, taskData: {
    title?: string
    description?: string
    estimated_hours?: number
    category?: string
    type?: 'standard' | 'custom'
    task_order?: number
  }): Promise<Task> {
    const updateData: any = {}
    
    if (taskData.title !== undefined) updateData.title = taskData.title
    if (taskData.description !== undefined) updateData.description = taskData.description
    if (taskData.estimated_hours !== undefined) updateData.estimated_hours = taskData.estimated_hours
    if (taskData.category !== undefined) updateData.category = taskData.category
    if (taskData.type !== undefined) updateData.type = taskData.type
    if (taskData.task_order !== undefined) updateData.task_order = taskData.task_order

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as Task
  }

  static async getTaskById(id: string): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data as Task
  }

  static async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async reorderTasks(taskOrders: { id: string; task_order: number }[]): Promise<void> {
    const updatePromises = taskOrders.map(({ id, task_order }) =>
      supabase
        .from('tasks')
        .update({ task_order })
        .eq('id', id)
    )
    
    const results = await Promise.all(updatePromises)
    
    const hasErrors = results.some(result => result.error)
    if (hasErrors) {
      throw new Error('Error al actualizar el orden de las tareas')
    }
  }

  static async getProjectOperarios(projectId?: string): Promise<any[]> {
    let query = supabase
      .from('project_operarios')
      .select(`
        *,
        user:user_id (
          id,
          name,
          email,
          role
        )
      `)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query.order('assigned_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async assignOperarioToProject(assignmentData: {
    project_id: string
    user_id: string
  }): Promise<any> {
    const { data, error } = await supabase
      .from('project_operarios')
      .insert({
        project_id: assignmentData.project_id,
        user_id: assignmentData.user_id
      })
      .select(`
        *,
        user:user_id (
          id,
          name,
          email,
          role
        )
      `)
      .single()
    
    if (error) throw error
    return data
  }

  static async unassignOperarioFromProject(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('project_operarios')
      .delete()
      .eq('id', assignmentId)
    
    if (error) throw error
  }

  static async getProjectTasks(projectId?: string): Promise<any[]> {
    let query = supabase
      .from('project_tasks')
      .select(`
        *,
        task:task_id (
          id,
          title,
          description,
          category,
          type,
          estimated_hours,
          created_by,
          created_at,
          updated_at
        ),
        assigned_user:assigned_to (
          id,
          name,
          role
        ),
        started_by_user:started_by (
          id,
          name,
          role
        ),
        completed_by_user:completed_by (
          id,
          name,
          role
        ),
        collaborators:task_collaborators (
          id,
          project_task_id,
          user_id,
          added_by,
          added_at,
          created_at,
          updated_at,
          user:user_id (
            id,
            name,
            role
          ),
          added_by_user:added_by (
            id,
            name,
            role
          )
        )
      `)
      .order('task_order', { ascending: true })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  static async createProjectTask(projectTaskData: {
    project_id: string
    task_id: string
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    estimated_hours?: number  // Tiempo estimado total para este proyecto
    actual_hours?: number
    assigned_to?: string
    start_date?: string
    end_date?: string
    progress_percentage?: number
    notes?: string
  }): Promise<any> {
    const insertData: any = {
      project_id: projectTaskData.project_id,
      task_id: projectTaskData.task_id,
      status: projectTaskData.status || 'pending',
      actual_hours: projectTaskData.actual_hours || 0,
      assigned_to: projectTaskData.assigned_to,
      start_date: projectTaskData.start_date,
      end_date: projectTaskData.end_date,
      progress_percentage: projectTaskData.progress_percentage || 0,
      notes: projectTaskData.notes
    }
    
    if (projectTaskData.estimated_hours !== undefined) {
      insertData.estimated_hours = projectTaskData.estimated_hours
    }
    
    const { data, error } = await supabase
      .from('project_tasks')
      .insert(insertData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateProjectTask(id: string, projectTaskData: {
    status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
    estimated_hours?: number
    actual_hours?: number
    assigned_to?: string
    start_date?: string
    end_date?: string
    progress_percentage?: number
    notes?: string
    task_order?: number
    started_by?: string
    started_at?: string
    completed_by?: string
    completed_at?: string
  }): Promise<any> {
    const updateData: any = {}
    
    if (projectTaskData.status !== undefined) updateData.status = projectTaskData.status
    if (projectTaskData.estimated_hours !== undefined) updateData.estimated_hours = projectTaskData.estimated_hours
    if (projectTaskData.actual_hours !== undefined) updateData.actual_hours = projectTaskData.actual_hours
    if (projectTaskData.assigned_to !== undefined) updateData.assigned_to = projectTaskData.assigned_to
    if (projectTaskData.start_date !== undefined) {
      updateData.start_date = projectTaskData.start_date === null ? null : projectTaskData.start_date
    }
    if (projectTaskData.end_date !== undefined) {
      updateData.end_date = projectTaskData.end_date === null ? null : projectTaskData.end_date
    }
    if (projectTaskData.progress_percentage !== undefined) updateData.progress_percentage = projectTaskData.progress_percentage
    if (projectTaskData.notes !== undefined) updateData.notes = projectTaskData.notes
    if (projectTaskData.task_order !== undefined) updateData.task_order = projectTaskData.task_order
    if (projectTaskData.started_by !== undefined) updateData.started_by = projectTaskData.started_by
    if (projectTaskData.started_at !== undefined) updateData.started_at = projectTaskData.started_at
    if (projectTaskData.completed_by !== undefined) updateData.completed_by = projectTaskData.completed_by
    if (projectTaskData.completed_at !== undefined) updateData.completed_at = projectTaskData.completed_at

    const { data, error } = await supabase
      .from('project_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteProjectTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async updateProjectTaskOrder(taskOrders: { id: string; task_order: number }[]): Promise<void> {
    const updatePromises = taskOrders.map(({ id, task_order }) =>
      supabase
        .from('project_tasks')
        .update({ task_order })
        .eq('id', id)
    )
    
    const results = await Promise.all(updatePromises)
    
    const hasError = results.some(result => result.error)
    if (hasError) {
      throw new Error('Error actualizando el orden de las tareas')
    }
  }

  static async getUserProjects(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_operarios!inner (
          user_id
        ),
        project_tasks (
          id,
          project_id,
          task_id,
          status,
          actual_hours,
          assigned_to,
          start_date,
          end_date,
          progress_percentage,
          notes,
          assigned_at,
          created_at,
          updated_at,
          task:task_id (
            id,
            title,
            description,
            category,
            type,
            estimated_hours,
            created_by,
            created_at,
            updated_at
          ),
          assigned_user:assigned_to (
            id,
            name,
            role
          )
        )
      `)
      .eq('project_operarios.user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getOperarioStats(operarioId: string): Promise<{
    total: number
    completed: number
    inProgress: number
    pending: number
  }> {
    const { data: projectTasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('assigned_to', operarioId)

    if (tasksError) throw tasksError

    const total = projectTasks?.length || 0
    const completed = projectTasks?.filter((task: any) => task.status === 'completed').length || 0
    const inProgress = projectTasks?.filter((task: any) => task.status === 'in_progress').length || 0
    const pending = projectTasks?.filter((task: any) => task.status === 'pending').length || 0

    return {
      total,
      completed,
      inProgress,
      pending,
    }
  }

  static async getAllClients(): Promise<any[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getAllClientContacts(): Promise<Record<string, any[]>> {
    const { data, error } = await supabase
      .from('client_contacts')
      .select('*')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    const contactsByClient: Record<string, any[]> = {}
    if (data) {
      for (const contact of data) {
        if (!contactsByClient[contact.client_id]) {
          contactsByClient[contact.client_id] = []
        }
        contactsByClient[contact.client_id].push(contact)
      }
    }
    
    return contactsByClient
  }

  static async getClientById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }

  static async createClient(clientData: {
    cuit: string
    company_name: string
    representative?: string
    email?: string
    phone?: string
  }): Promise<any> {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateClient(id: string, clientData: {
    cuit?: string
    company_name?: string
    representative?: string
    email?: string
    phone?: string
  }): Promise<any> {
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...clientData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteClient(id: string): Promise<void> {
    const { data: projects, error: checkError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('client_id', id)
    
    if (checkError) throw checkError
    
    if (projects && projects.length > 0) {
      throw new Error(`No se puede eliminar el cliente porque tiene ${projects.length} proyecto(s) asociado(s). Primero debe desasociar o eliminar los proyectos.`)
    }
    
    await this.deleteAllClientContacts(id)
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async getClientContacts(clientId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async getClientContactById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('client_contacts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }

  static async createClientContact(clientId: string, contactData: {
    name: string
    email: string
    phone: string
    role: string
    isPrimary?: boolean
  }): Promise<any> {
    if (contactData.isPrimary) {
      await supabase
        .from('client_contacts')
        .update({ is_primary: false })
        .eq('client_id', clientId)
        .eq('is_primary', true)
    }
    
    const generateId = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 15)
      return `${timestamp}-${random}`
    }
    
    const contactId = generateId()
    
    const { data, error } = await supabase
      .from('client_contacts')
      .insert({
        id: contactId,
        client_id: clientId,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        role: contactData.role,
        is_primary: contactData.isPrimary || false
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateClientContact(id: string, contactData: {
    name?: string
    email?: string
    phone?: string
    role?: string
    isPrimary?: boolean
  }): Promise<any> {
    if (contactData.isPrimary !== undefined && contactData.isPrimary) {
      const { data: currentContact } = await supabase
        .from('client_contacts')
        .select('client_id')
        .eq('id', id)
        .single()
      
      if (currentContact) {
        await supabase
          .from('client_contacts')
          .update({ is_primary: false })
          .eq('client_id', currentContact.client_id)
          .eq('is_primary', true)
          .neq('id', id)
      }
    }
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (contactData.name !== undefined) updateData.name = contactData.name
    if (contactData.email !== undefined) updateData.email = contactData.email
    if (contactData.phone !== undefined) updateData.phone = contactData.phone
    if (contactData.role !== undefined) updateData.role = contactData.role
    if (contactData.isPrimary !== undefined) updateData.is_primary = contactData.isPrimary
    
    const { data, error } = await supabase
      .from('client_contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteClientContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('client_contacts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async deleteAllClientContacts(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('client_contacts')
      .delete()
      .eq('client_id', clientId)
    
    if (error) throw error
  }
}

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
} from './generated/prisma/index'