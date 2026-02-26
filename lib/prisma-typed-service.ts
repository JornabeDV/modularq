import { supabase } from './supabase'
import type { User, Project, Task } from './generated/prisma/index'
import type { BudgetAttachment } from './types/budget'

export interface ModuleDescriptionSection {
  section: string
  description: string
}

export type UserTask = {
  id: string
  status: 'completed' | 'in_progress' | 'pending' | 'assigned'
}

export class PrismaTypedService {
  static async getAllUsers(includeDeleted = false): Promise<User[]> {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (!includeDeleted) {
      query = query.is('deleted_at', null)
    }

    const { data, error } = await query

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
    role: 'admin' | 'supervisor' | 'operario' | 'subcontratista'
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
    role?: 'admin' | 'supervisor' | 'operario' | 'subcontratista'
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
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error
  }

  static async restoreUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: null })
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
        ),
        project_operarios (
          id,
          project_id,
          user_id,
          assigned_at,
          user:user_id (
            id,
            name,
            role,
            deleted_at
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
      .order('task_order', { ascending: true })
    
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

    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
    
    if (error) throw error
    return { id, ...updateData } as Task
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
          role,
          deleted_at
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
    estimated_hours?: number
    actual_hours?: number
    assigned_to?: string
    start_date?: string
    end_date?: string
    progress_percentage?: number
    notes?: string
    task_order?: number
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
      notes: projectTaskData.notes,
      ...(projectTaskData.task_order !== undefined && { task_order: projectTaskData.task_order })
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
    assigned_to?: string | null
    start_date?: string | null
    end_date?: string | null
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
    
    if (projectTaskData.assigned_to !== undefined) {
      updateData.assigned_to = projectTaskData.assigned_to === null ? null : projectTaskData.assigned_to
    }
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

    const { error } = await supabase
      .from("project_tasks")
      .update(updateData)
      .eq("id", id)

    if (error) throw error
    return { id, ...updateData }
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

  // Materiales
  static async getAllMaterials(): Promise<any[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Obtener el siguiente código disponible para una categoría
  static async getNextMaterialCode(category: string): Promise<string> {
    const categoryPrefixes: Record<string, string> = {
      estructura: 'EST',
      paneles: 'PAN',
      herrajes: 'HER',
      aislacion: 'AIS',
      electricidad: 'ELE',
      sanitarios: 'SAN',
      otros: 'OTR'
    }

    const prefix = categoryPrefixes[category] || 'MAT'
    
    const { data, error } = await supabase
      .from('materials')
      .select('code')
      .like('code', `${prefix}-%`)
      .order('code', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    let nextNumber = 1
    
    if (data && data.length > 0) {
      const lastCode = data[0].code
      const match = lastCode.match(/-(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }
    
    return `${prefix}-${String(nextNumber).padStart(3, '0')}`
  }

  static async getMaterialById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }

  static async createMaterial(materialData: {
    code: string
    name: string
    description?: string
    category: 'estructura' | 'paneles' | 'herrajes' | 'aislacion' | 'electricidad' | 'sanitarios' | 'otros'
    unit: 'unidad' | 'metro' | 'metro_cuadrado' | 'metro_cubico' | 'kilogramo' | 'litro'
    stock_quantity?: number
    min_stock?: number
    unit_price?: number
    supplier?: string
  }): Promise<any> {
    const { data, error } = await supabase
      .from('materials')
      .insert({
        ...materialData,
        stock_quantity: materialData.stock_quantity ?? 0,
        min_stock: materialData.min_stock ?? 0,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateMaterial(id: string, materialData: {
    code?: string
    name?: string
    description?: string
    category?: 'estructura' | 'paneles' | 'herrajes' | 'aislacion' | 'electricidad' | 'sanitarios' | 'otros'
    unit?: 'unidad' | 'metro' | 'metro_cuadrado' | 'metro_cubico' | 'kilogramo' | 'litro'
    stock_quantity?: number
    min_stock?: number
    unit_price?: number
    supplier?: string
  }): Promise<any> {
    const { data, error } = await supabase
      .from('materials')
      .update({
        ...materialData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteMaterial(id: string): Promise<void> {
    const { data: projectMaterials, error: checkError } = await supabase
      .from('project_materials')
      .select('id')
      .eq('material_id', id)
    
    if (checkError) throw checkError
    
    if (projectMaterials && projectMaterials.length > 0) {
      throw new Error(`No se puede eliminar el material porque está asignado a ${projectMaterials.length} proyecto(s). Primero debe desasociar el material de los proyectos.`)
    }
    
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Project Materials (relación entre proyectos y materiales)
  static async getProjectMaterials(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_materials')
      .select(`
        *,
        material:materials (
          id,
          code,
          name,
          description,
          category,
          unit,
          stock_quantity,
          min_stock,
          unit_price,
          supplier
        )
      `)
      .eq('project_id', projectId)
      .order('assigned_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async addMaterialToProject(projectId: string, materialData: {
    material_id: string
    quantity: number
    unit_price?: number
    notes?: string
    assigned_by?: string
  }): Promise<any> {
    const material = await this.getMaterialById(materialData.material_id)
    if (!material) {
      throw new Error('Material no encontrado')
    }
    
    const currentStock = material.stock_quantity ?? 0
    if (currentStock < materialData.quantity) {
      throw new Error(`Stock insuficiente. Disponible: ${currentStock} ${material.unit}, Requerido: ${materialData.quantity} ${material.unit}`)
    }
    
    const newStock = currentStock - materialData.quantity
    const { error: updateStockError } = await supabase
      .from('materials')
      .update({ 
        stock_quantity: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', materialData.material_id)
    
    if (updateStockError) {
      throw new Error(`Error al actualizar stock: ${updateStockError.message}`)
    }
    
    const { data, error } = await supabase
      .from('project_materials')
      .insert({
        project_id: projectId,
        material_id: materialData.material_id,
        quantity: materialData.quantity,
        unit_price: materialData.unit_price || material.unit_price,
        notes: materialData.notes,
        assigned_by: materialData.assigned_by
      })
      .select(`
        *,
        material:materials (*)
      `)
      .single()
    
    if (error) {
      await supabase
        .from('materials')
        .update({ 
          stock_quantity: currentStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', materialData.material_id)
      throw error
    }
    
    return data
  }

  static async updateProjectMaterial(id: string, materialData: {
    quantity?: number
    unit_price?: number
    notes?: string
  }): Promise<any> {
    if (materialData.quantity !== undefined) {
      const { data: currentData, error: fetchError } = await supabase
        .from('project_materials')
        .select(`
          *,
          material:materials (
            id,
            stock_quantity
          )
        `)
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      if (!currentData) throw new Error('Material del proyecto no encontrado')
      
      const material = currentData.material
      if (material) {
        const currentQuantity = currentData.quantity
        const newQuantity = materialData.quantity
        const difference = newQuantity - currentQuantity
        const currentStock = material.stock_quantity ?? 0
        
        if (difference > 0) {
          if (currentStock < difference) {
            throw new Error(`Stock insuficiente. Disponible: ${currentStock}, Requerido adicional: ${difference}`)
          }
          
          const newStock = currentStock - difference
          const { error: updateStockError } = await supabase
            .from('materials')
            .update({ 
              stock_quantity: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', material.id)
          
          if (updateStockError) {
            throw new Error(`Error al actualizar stock: ${updateStockError.message}`)
          }
        }
        else if (difference < 0) {
          const newStock = currentStock + Math.abs(difference)
          const { error: updateStockError } = await supabase
            .from('materials')
            .update({ 
              stock_quantity: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', material.id)
          
          if (updateStockError) {
            throw new Error(`Error al devolver stock: ${updateStockError.message}`)
          }
        }
      }
    }
    
    const { data, error } = await supabase
      .from('project_materials')
      .update(materialData)
      .eq('id', id)
      .select(`
        *,
        material:materials (*)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  static async removeMaterialFromProject(id: string): Promise<void> {
    const { data: projectMaterial, error: fetchError } = await supabase
      .from('project_materials')
      .select(`
        *,
        material:materials (
          id,
          stock_quantity
        )
      `)
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError
    if (!projectMaterial) throw new Error('Material del proyecto no encontrado')
    
    const material = projectMaterial.material
    if (material) {
      const currentStock = material.stock_quantity ?? 0
      const quantityToReturn = projectMaterial.quantity
      const newStock = currentStock + quantityToReturn
      
      const { error: updateStockError } = await supabase
        .from('materials')
        .update({ 
          stock_quantity: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', material.id)
      
      if (updateStockError) {
        throw new Error(`Error al devolver stock: ${updateStockError.message}`)
      }
    }
    
    const { error } = await supabase
      .from('project_materials')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Client Contacts
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

  // Project Planning Checklist
  static async getProjectPlanningChecklist(projectId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('project_planning_checklist')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async updateProjectPlanningChecklistItem(
    projectId: string,
    checklistItem: string,
    updates: {
      is_completed?: boolean;
      notes?: string;
      completed_by?: string;
      completed_at?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('project_planning_checklist')
        .select('id')
        .eq('project_id', projectId)
        .eq('checklist_item', checklistItem)
        .limit(1)

      if (selectError) throw selectError

      if (existing && existing.length > 0) {
        const { error } = await supabase
          .from('project_planning_checklist')
          .update({
            is_completed: updates.is_completed,
            notes: updates.notes,
            completed_by: updates.completed_by,
            completed_at: updates.completed_at,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing[0].id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('project_planning_checklist')
          .insert({
            project_id: projectId,
            checklist_item: checklistItem,
            is_completed: updates.is_completed || false,
            notes: updates.notes,
            completed_by: updates.completed_by,
            completed_at: updates.completed_at
          })

        if (error) throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating planning checklist item:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  static async getTasksByUser(userId: string): Promise<UserTask[]> {
    const { data, error } = await supabase
      .from('project_tasks')
      .select('id, status')
      .eq('assigned_to', userId)

    if (error) throw error

    return data ?? []
  }

  // =====================================================
  // MÓDULO DE PRESUPUESTOS
  // =====================================================

  // --- Labor Concepts (Conceptos de Mano de Obra) ---

  static async getAllLaborConcepts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('labor_concepts')
      .select('*')
      .order('category', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async getLaborConceptById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('labor_concepts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }

  static async createLaborConcept(conceptData: {
    code: string
    name: string
    category: string
    hourly_rate: number
  }): Promise<any> {
    const generateId = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 15)
      return `${timestamp}-${random}`
    }

    const { data, error } = await supabase
      .from('labor_concepts')
      .insert({
        id: generateId(),
        ...conceptData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateLaborConcept(id: string, conceptData: {
    code?: string
    name?: string
    category?: string
    hourly_rate?: number
  }): Promise<any> {
    const { data, error } = await supabase
      .from('labor_concepts')
      .update({
        ...conceptData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteLaborConcept(id: string): Promise<void> {
    const { error } = await supabase
      .from('labor_concepts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // --- Budget Item Templates ---

  static async getAllBudgetItemTemplates(includeNonStandard = false): Promise<any[]> {
    let query = supabase
      .from('budget_item_templates')
      .select('*')
      .order('order', { ascending: true })
    
    if (!includeNonStandard) {
      query = query.eq('is_standard', true)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  }

  static async getBudgetItemTemplateById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('budget_item_templates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }

  static async createBudgetItemTemplate(templateData: {
    code: string
    category: string
    description: string
    unit: string
    is_standard?: boolean
    order?: number
    template_labors?: any[]
    template_materials?: any[]
    template_equipments?: any[]
  }): Promise<any> {
    const generateId = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 15)
      return `${timestamp}-${random}`
    }

    const { data, error } = await supabase
      .from('budget_item_templates')
      .insert({
        id: generateId(),
        code: templateData.code,
        category: templateData.category,
        description: templateData.description,
        unit: templateData.unit,
        is_standard: templateData.is_standard ?? true,
        order: templateData.order ?? 0,
        template_labors: templateData.template_labors,
        template_materials: templateData.template_materials,
        template_equipments: templateData.template_equipments,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateBudgetItemTemplate(id: string, templateData: {
    code?: string
    category?: string
    description?: string
    unit?: string
    is_standard?: boolean
    order?: number
    template_labors?: any[]
    template_materials?: any[]
    template_equipments?: any[]
  }): Promise<any> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (templateData.code !== undefined) updateData.code = templateData.code
    if (templateData.category !== undefined) updateData.category = templateData.category
    if (templateData.description !== undefined) updateData.description = templateData.description
    if (templateData.unit !== undefined) updateData.unit = templateData.unit
    if (templateData.is_standard !== undefined) updateData.is_standard = templateData.is_standard
    if (templateData.order !== undefined) updateData.order = templateData.order
    if (templateData.template_labors !== undefined) updateData.template_labors = templateData.template_labors
    if (templateData.template_materials !== undefined) updateData.template_materials = templateData.template_materials
    if (templateData.template_equipments !== undefined) updateData.template_equipments = templateData.template_equipments

    const { data, error } = await supabase
      .from('budget_item_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteBudgetItemTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('budget_item_templates')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // --- Budgets (Presupuestos) ---

  static async getAllBudgets(): Promise<any[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        items:budget_items(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getBudgetById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        items:budget_items(
          *,
          price_analysis:budget_item_price_analyses(
            *,
            labors:budget_item_labors(*),
            materials:budget_item_materials(*),
            equipments:budget_item_equipments(*)
          )
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) return null
    
    // Ordenar ítems por código
    if (data?.items) {
      data.items.sort((a: any, b: any) => {
        // Función para comparar códigos como "1.1", "1.2", "2.1", "10.1"
        const parseCode = (code: string) => {
          const parts = code.split('.')
          return parts.map(p => parseInt(p) || 0)
        }
        
        const aParts = parseCode(a.code)
        const bParts = parseCode(b.code)
        
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aVal = aParts[i] || 0
          const bVal = bParts[i] || 0
          if (aVal !== bVal) return aVal - bVal
        }
        return 0
      })
    }
    
    return data
  }

  // Descripción estándar del módulo
  static readonly DEFAULT_MODULE_DESCRIPTION = [
    {
      section: "Estructura",
      description: "Construído con caño estructural tubular de 80 x 80 x 2,5mm pintados con Casa Blanca 3 en 1 antióxido. Muros y techo de panel térmico de 50 mm de espesor PIR, revestidos con chapa prepintada blanca. Piso multilaminado de 18 mm de espesor con revestimiento de piso de PVC heterogéneo, con zócalo de PVC."
    },
    {
      section: "Cerramientos",
      description: "Una puerta de acceso. Dos ventanas de aluminio modena 90 de 1,00x1,00m."
    },
    {
      section: "Electricidad",
      description: "Instalación eléctrica reglamentaria. Tablero general con llaves térmicas independientes por sector. Las instalaciones se realizaran con caño de PVC rígidos pesados."
    },
    {
      section: "Luminaria",
      description: "Luces led de 18w."
    },
    {
      section: "Equipamiento",
      description: "Aire acondicionado split frío calor de 3000 frigorías con jaula exterior para soporte de unidad exterior."
    }
  ];

  static async createBudget(budgetData: {
    client_name: string
    location: string
    description?: string
    client_id?: string
    general_expenses_pct?: number
    benefit_pct?: number
    iva_pct?: number
  }): Promise<any> {
    // Generar ID único
    const generateId = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 15)
      return `${timestamp}-${random}`
    }

    // Generar código único (PRES-YYYY-NNN)
    const year = new Date().getFullYear()
    const { data: countData } = await supabase
      .from('budgets')
      .select('id')
      .gte('created_at', `${year}-01-01`)
      .lte('created_at', `${year}-12-31`)
    
    const count = countData?.length || 0
    const budgetCode = `PRES-${year}-${String(count + 1).padStart(3, '0')}`

    const budgetId = generateId()

    // Crear presupuesto con descripción estándar del módulo
    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({
        id: budgetId,
        budget_code: budgetCode,
        client_name: budgetData.client_name,
        location: budgetData.location,
        description: budgetData.description,
        client_id: budgetData.client_id,
        status: 'draft',
        general_expenses_pct: budgetData.general_expenses_pct ?? 17,
        benefit_pct: budgetData.benefit_pct ?? 40,
        iva_pct: budgetData.iva_pct ?? 10.5,
        subtotal_direct_costs: 0,
        subtotal_with_expenses: 0,
        subtotal_with_benefit: 0,
        calculated_price: 0,
        final_price: 0,
        module_description: this.DEFAULT_MODULE_DESCRIPTION,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error

    // Cargar ítems estándar desde templates
    const { data: templates } = await supabase
      .from('budget_item_templates')
      .select('*')
      .eq('is_standard', true)
      .order('order', { ascending: true })

    if (templates && templates.length > 0) {
      const budgetItems = templates.map((template: any, index: number) => ({
        id: generateId(),
        budget_id: budget.id,
        template_id: template.id,
        code: template.code,
        category: template.category,
        description: template.description,
        unit: template.unit,
        is_custom: false,
        order: index,
        quantity: template.default_quantity || 0,
        unit_cost_labor: 0,
        unit_cost_materials: 0,
        unit_cost_equipment: 0,
        unit_cost_total: 0,
        total_cost: 0
      }))

      const { error: itemsError } = await supabase
        .from('budget_items')
        .insert(budgetItems)

      if (itemsError) throw itemsError

      // Crear análisis de precios para cada ítem basado en el template
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i]
        const budgetItem = budgetItems[i]

        // Crear análisis vacío
        const { data: analysis } = await supabase
          .from('budget_item_price_analyses')
          .insert({ 
            id: generateId(),
            budget_item_id: budgetItem.id,
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (analysis) {
          // Copiar labors del template si existen
          if (template.template_labors && template.template_labors.length > 0) {
            const labors = await Promise.all(
              template.template_labors.map(async (labor: any) => {
                const { data: concept } = await supabase
                  .from('labor_concepts')
                  .select('hourly_rate')
                  .eq('id', labor.labor_concept_id)
                  .single()
                
                return {
                  id: generateId(),
                  analysis_id: analysis.id,
                  labor_concept_id: labor.labor_concept_id,
                  quantity_hours: labor.quantity_hours,
                  hourly_rate: concept?.hourly_rate || 0,
                  total_cost: (labor.quantity_hours || 0) * (concept?.hourly_rate || 0)
                }
              })
            )

            await supabase.from('budget_item_labors').insert(labors)
          }

          // Copiar materiales del template si existen
          if (template.template_materials && template.template_materials.length > 0) {
            const materials = await Promise.all(
              template.template_materials.map(async (material: any) => {
                const { data: mat } = await supabase
                  .from('materials')
                  .select('unit_price, name')
                  .eq('id', material.material_id)
                  .single()
                
                return {
                  id: generateId(),
                  analysis_id: analysis.id,
                  material_id: material.material_id,
                  material_name: mat?.name,
                  quantity: material.quantity,
                  unit_price: mat?.unit_price || 0,
                  total_cost: (material.quantity || 0) * (mat?.unit_price || 0)
                }
              })
            )

            await supabase.from('budget_item_materials').insert(materials)
          }

          // Copiar equipos del template si existen
          if (template.template_equipments && template.template_equipments.length > 0) {
            const equipments = template.template_equipments.map((equipment: any) => ({
              id: generateId(),
              analysis_id: analysis.id,
              name: equipment.name,
              quantity_hours: equipment.quantity_hours,
              hourly_cost: equipment.hourly_cost,
              total_cost: (equipment.quantity_hours || 0) * (equipment.hourly_cost || 0)
            }))

            await supabase.from('budget_item_equipments').insert(equipments)
          }
        }
      }
    }

    return this.getBudgetById(budget.id)
  }

  static async updateBudget(id: string, budgetData: {
    client_name?: string
    location?: string
    description?: string
    client_id?: string
    status?: 'draft' | 'sent' | 'approved' | 'rejected'
    general_expenses_pct?: number
    benefit_pct?: number
    iva_pct?: number
    gross_income_pct?: number
    final_price?: number
    sent_at?: string
    approved_at?: string
    rejected_at?: string
    validity_days?: number
    payment_terms?: string
    delivery_terms?: string
    delivery_location?: string
    notes?: string
    module_description?: ModuleDescriptionSection[]
  }): Promise<any> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (budgetData.client_name !== undefined) updateData.client_name = budgetData.client_name
    if (budgetData.location !== undefined) updateData.location = budgetData.location
    if (budgetData.description !== undefined) updateData.description = budgetData.description
    if (budgetData.client_id !== undefined) updateData.client_id = budgetData.client_id
    if (budgetData.status !== undefined) updateData.status = budgetData.status
    if (budgetData.general_expenses_pct !== undefined) updateData.general_expenses_pct = budgetData.general_expenses_pct
    if (budgetData.benefit_pct !== undefined) updateData.benefit_pct = budgetData.benefit_pct
    if (budgetData.iva_pct !== undefined) updateData.iva_pct = budgetData.iva_pct
    if (budgetData.gross_income_pct !== undefined) updateData.gross_income_pct = budgetData.gross_income_pct
    if (budgetData.final_price !== undefined) updateData.final_price = budgetData.final_price
    if (budgetData.sent_at !== undefined) updateData.sent_at = budgetData.sent_at
    if (budgetData.approved_at !== undefined) updateData.approved_at = budgetData.approved_at
    if (budgetData.rejected_at !== undefined) updateData.rejected_at = budgetData.rejected_at
    if (budgetData.validity_days !== undefined) updateData.validity_days = budgetData.validity_days
    if (budgetData.payment_terms !== undefined) updateData.payment_terms = budgetData.payment_terms
    if (budgetData.delivery_terms !== undefined) updateData.delivery_terms = budgetData.delivery_terms
    if (budgetData.delivery_location !== undefined) updateData.delivery_location = budgetData.delivery_location
    if (budgetData.notes !== undefined) updateData.notes = budgetData.notes
    if (budgetData.module_description !== undefined) updateData.module_description = budgetData.module_description

    const { data, error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteBudget(id: string): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async recalculateBudget(budgetId: string): Promise<any> {
    
    // Obtener todos los ítems del presupuesto
    const { data: items, error: itemsError } = await supabase
      .from('budget_items')
      .select('*')
      .eq('budget_id', budgetId)

    if (itemsError) throw itemsError
    if (!items || items.length === 0) return

    // Obtener todos los análisis de una vez
    const itemIds = items.map((i: any) => i.id)
    const { data: analyses } = await supabase
      .from('budget_item_price_analyses')
      .select('*')
      .in('budget_item_id', itemIds)

    const analysisIds = (analyses || []).map((a: any) => a.id)
    
    // Obtener todos los labors, materials y equipments de una vez
    const [{ data: allLabors }, { data: allMaterials }, { data: allEquipments }] = await Promise.all([
      analysisIds.length > 0 ? supabase.from('budget_item_labors').select('*').in('analysis_id', analysisIds) : { data: [] },
      analysisIds.length > 0 ? supabase.from('budget_item_materials').select('*').in('analysis_id', analysisIds) : { data: [] },
      analysisIds.length > 0 ? supabase.from('budget_item_equipments').select('*').in('analysis_id', analysisIds) : { data: [] }
    ])

    // Crear mapas para acceso rápido
    const analysisByItemId = new Map((analyses || []).map((a: any) => [a.budget_item_id, a]))
    const laborsByAnalysisId = new Map()
    const materialsByAnalysisId = new Map()
    const equipmentsByAnalysisId = new Map()

    ;(allLabors || []).forEach((l: any) => {
      if (!laborsByAnalysisId.has(l.analysis_id)) laborsByAnalysisId.set(l.analysis_id, [])
      laborsByAnalysisId.get(l.analysis_id).push(l)
    })
    ;(allMaterials || []).forEach((m: any) => {
      if (!materialsByAnalysisId.has(m.analysis_id)) materialsByAnalysisId.set(m.analysis_id, [])
      materialsByAnalysisId.get(m.analysis_id).push(m)
    })
    ;(allEquipments || []).forEach((e: any) => {
      if (!equipmentsByAnalysisId.has(e.analysis_id)) equipmentsByAnalysisId.set(e.analysis_id, [])
      equipmentsByAnalysisId.get(e.analysis_id).push(e)
    })

    // Procesar cada ítem
    const updates = items.map((item: any) => {
      const analysis = analysisByItemId.get(item.id)
      let unitCostLabor = 0
      let unitCostMaterials = 0
      let unitCostEquipment = 0

      if (analysis) {
        const analysisId = (analysis as any).id
        const labors = laborsByAnalysisId.get(analysisId) || []
        const materials = materialsByAnalysisId.get(analysisId) || []
        const equipments = equipmentsByAnalysisId.get(analysisId) || []

        unitCostLabor = labors.reduce((sum: number, l: any) => sum + (l.total_cost || 0), 0)
        unitCostMaterials = materials.reduce((sum: number, m: any) => sum + (m.total_cost || 0), 0)
        unitCostEquipment = equipments.reduce((sum: number, e: any) => sum + (e.total_cost || 0), 0)
      }

      const unitCostTotal = unitCostLabor + unitCostMaterials + unitCostEquipment
      const totalCost = (item.quantity || 0) * unitCostTotal

      return {
        id: item.id,
        unit_cost_labor: unitCostLabor,
        unit_cost_materials: unitCostMaterials,
        unit_cost_equipment: unitCostEquipment,
        unit_cost_total: unitCostTotal,
        total_cost: totalCost
      }
    })

    // Actualizar todos los items (en batches de 10)
    for (let i = 0; i < updates.length; i += 10) {
      const batch = updates.slice(i, i + 10)
      await Promise.all(batch.map((update: any) => 
        supabase.from('budget_items').update({
          unit_cost_labor: update.unit_cost_labor,
          unit_cost_materials: update.unit_cost_materials,
          unit_cost_equipment: update.unit_cost_equipment,
          unit_cost_total: update.unit_cost_total,
          total_cost: update.total_cost
        }).eq('id', update.id)
      ))
    }

    // Calcular totales
    const subtotalDirectCosts = updates.reduce((sum: number, u: any) => sum + u.total_cost, 0)

    // Obtener porcentajes del presupuesto
    const { data: budget } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', budgetId)
      .single()

    if (!budget) throw new Error('Presupuesto no encontrado')

    const generalExpensesPct = budget.general_expenses_pct || 0
    const benefitPct = budget.benefit_pct || 0
    const ivaPct = budget.iva_pct || 0
    const grossIncomePct = budget.gross_income_pct || 0

    const generalExpenses = subtotalDirectCosts * (generalExpensesPct / 100)
    const subtotalWithExpenses = subtotalDirectCosts + generalExpenses
    const benefit = subtotalWithExpenses * (benefitPct / 100)
    const subtotalWithBenefit = subtotalWithExpenses + benefit
    const iva = subtotalWithBenefit * (ivaPct / 100)
    const grossIncome = subtotalWithBenefit * (grossIncomePct / 100)
    const calculatedPrice = subtotalWithBenefit + iva + grossIncome

    const { error: updateError } = await supabase
      .from('budgets')
      .update({
        subtotal_direct_costs: subtotalDirectCosts,
        subtotal_with_expenses: subtotalWithExpenses,
        subtotal_with_benefit: subtotalWithBenefit,
        calculated_price: calculatedPrice,
        final_price: calculatedPrice, // Sincronizado automáticamente
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetId)

    if (updateError) throw new Error('Error actualizando presupuesto: ' + updateError.message)
  }

  static async approveBudget(budgetId: string): Promise<{ success: boolean; budget?: any; error?: string }> {
    try {
      // Obtener presupuesto
      const budget = await this.getBudgetById(budgetId)
      if (!budget) {
        return { success: false, error: 'Presupuesto no encontrado' }
      }

      if (budget.status === 'approved') {
        return { success: false, error: 'El presupuesto ya está aprobado' }
      }

      // Actualizar presupuesto a aprobado
      const { data: updatedBudget, error: updateError } = await supabase
        .from('budgets')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', budgetId)
        .select()
        .single()

      if (updateError) throw updateError

      return {
        success: true,
        budget: updatedBudget
      }
    } catch (error) {
      console.error('Error approving budget:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  // --- Budget Items ---

  static async addBudgetItem(budgetId: string, itemData: {
    code: string
    category: string
    description: string
    unit: string
    quantity?: number
    is_custom?: boolean
  }): Promise<any> {
    const generateId = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 15)
      return `${timestamp}-${random}`
    }

    // Obtener el máximo orden actual
    const { data: maxOrderData } = await supabase
      .from('budget_items')
      .select('order')
      .eq('budget_id', budgetId)
      .order('order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.order || 0) + 1
    const itemId = generateId()

    // Crear ítem
    const { data: item, error } = await supabase
      .from('budget_items')
      .insert({
        id: itemId,
        budget_id: budgetId,
        code: itemData.code,
        category: itemData.category,
        description: itemData.description,
        unit: itemData.unit,
        quantity: itemData.quantity || 0,
        is_custom: itemData.is_custom ?? true,
        order: nextOrder,
        unit_cost_labor: 0,
        unit_cost_materials: 0,
        unit_cost_equipment: 0,
        unit_cost_total: 0,
        total_cost: 0
      })
      .select()
      .single()

    if (error) throw error

    // Crear análisis de precios vacío
    await supabase
      .from('budget_item_price_analyses')
      .insert({ 
        id: generateId(),
        budget_item_id: item.id,
        updated_at: new Date().toISOString()
      })

    return item
  }

  static async updateBudgetItem(id: string, itemData: {
    quantity?: number
    description?: string
    code?: string
    category?: string
    unit?: string
    order?: number
  }): Promise<any> {
    const updateData: any = {}

    if (itemData.quantity !== undefined) updateData.quantity = itemData.quantity
    if (itemData.description !== undefined) updateData.description = itemData.description
    if (itemData.code !== undefined) updateData.code = itemData.code
    if (itemData.category !== undefined) updateData.category = itemData.category
    if (itemData.unit !== undefined) updateData.unit = itemData.unit
    if (itemData.order !== undefined) updateData.order = itemData.order

    const { data, error } = await supabase
      .from('budget_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteBudgetItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('budget_items')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // --- Price Analysis ---

  static async updatePriceAnalysis(itemId: string, analysisData: {
    labors?: Array<{
      labor_concept_id: string
      quantity_hours: number
      hourly_rate?: number
    }>
    materials?: Array<{
      material_id?: string
      material_name?: string
      quantity: number
      unit_price?: number
    }>
    equipments?: Array<{
      name: string
      quantity_hours: number
      hourly_cost: number
    }>
  }): Promise<any> {
    const generateId = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 15)
      return `${timestamp}-${random}`
    }

    // Obtener o crear análisis
    const { data: existingAnalysis } = await supabase
      .from('budget_item_price_analyses')
      .select('id')
      .eq('budget_item_id', itemId)
      .single()

    let analysisId = existingAnalysis?.id

    if (!analysisId) {
      const newId = generateId()
      const { data: newAnalysis, error: createError } = await supabase
        .from('budget_item_price_analyses')
        .insert({ 
          id: newId,
          budget_item_id: itemId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) throw new Error('Error creando análisis: ' + createError.message)
      analysisId = newAnalysis?.id
    }

    if (!analysisId) throw new Error('No se pudo crear/obtener el análisis')

    // Actualizar labors (en paralelo con otros deletes)
    const laborPromise = analysisData.labors ? (async () => {
      await supabase.from('budget_item_labors').delete().eq('analysis_id', analysisId)
      if (analysisData.labors!.length > 0) {
        const labors = await Promise.all(
          analysisData.labors!.map(async (labor) => {
            // Usar el hourly_rate enviado, o buscarlo en la BD si no viene
            let hourlyRate = labor.hourly_rate
            if (hourlyRate === undefined || hourlyRate === null) {
              const { data: concept } = await supabase
                .from('labor_concepts')
                .select('hourly_rate')
                .eq('id', labor.labor_concept_id)
                .single()
              hourlyRate = concept?.hourly_rate || 0
            }
            return {
              id: generateId(),
              analysis_id: analysisId,
              labor_concept_id: labor.labor_concept_id,
              quantity_hours: labor.quantity_hours,
              hourly_rate: hourlyRate,
              total_cost: labor.quantity_hours * (hourlyRate || 0)
            }
          })
        )
        await supabase.from('budget_item_labors').insert(labors)
      }
    })() : Promise.resolve()

    // Actualizar materiales (en paralelo)
    const materialPromise = analysisData.materials ? (async () => {
      await supabase.from('budget_item_materials').delete().eq('analysis_id', analysisId)
      if (analysisData.materials!.length > 0) {
        const materials = await Promise.all(
          analysisData.materials!.map(async (material) => {
            let unitPrice = material.unit_price
            let materialName = material.material_name
            if (material.material_id && !unitPrice) {
              const { data: mat } = await supabase
                .from('materials')
                .select('unit_price, name')
                .eq('id', material.material_id)
                .single()
              unitPrice = mat?.unit_price || 0
              materialName = mat?.name || materialName
            }
            return {
              id: generateId(),
              analysis_id: analysisId,
              material_id: material.material_id,
              material_name: materialName,
              quantity: material.quantity,
              unit_price: unitPrice,
              total_cost: material.quantity * (unitPrice || 0)
            }
          })
        )
        await supabase.from('budget_item_materials').insert(materials)
      }
    })() : Promise.resolve()

    // Actualizar equipos (en paralelo)
    const equipmentPromise = analysisData.equipments ? (async () => {
      await supabase.from('budget_item_equipments').delete().eq('analysis_id', analysisId)
      if (analysisData.equipments!.length > 0) {
        const equipments = analysisData.equipments!.map(equipment => ({
          id: generateId(),
          analysis_id: analysisId,
          name: equipment.name,
          quantity_hours: equipment.quantity_hours,
          hourly_cost: equipment.hourly_cost,
          total_cost: equipment.quantity_hours * equipment.hourly_cost
        }))
        await supabase.from('budget_item_equipments').insert(equipments)
      }
    })() : Promise.resolve()

    // Esperar todas las actualizaciones en paralelo
    await Promise.all([laborPromise, materialPromise, equipmentPromise])

    // Recalcular SOLO el ítem modificado (optimizado)
    return await this.recalculateSingleItem(itemId)
  }

  // Método optimizado para recalcular solo un ítem y actualizar totales del presupuesto
  static async recalculateSingleItem(itemId: string): Promise<any> {
    // Obtener el ítem y su presupuesto
    const { data: item, error: itemError } = await supabase
      .from('budget_items')
      .select('*, budget:budget_id(*)')
      .eq('id', itemId)
      .single()
    
    if (itemError || !item) throw new Error('Ítem no encontrado')
    
    const budgetId = item.budget_id
    const budget = item.budget
    
    // Obtener el análisis del ítem
    const { data: analysis } = await supabase
      .from('budget_item_price_analyses')
      .select('id')
      .eq('budget_item_id', itemId)
      .single()
    
    let unitCostLabor = 0
    let unitCostMaterials = 0
    let unitCostEquipment = 0

    if (analysis) {
      // Obtener labors, materials y equipments en paralelo
      const [{ data: labors }, { data: materials }, { data: equipments }] = await Promise.all([
        supabase.from('budget_item_labors').select('*').eq('analysis_id', analysis.id),
        supabase.from('budget_item_materials').select('*').eq('analysis_id', analysis.id),
        supabase.from('budget_item_equipments').select('*').eq('analysis_id', analysis.id)
      ])

      unitCostLabor = (labors || []).reduce((sum: number, l: any) => sum + (l.total_cost || 0), 0)
      unitCostMaterials = (materials || []).reduce((sum: number, m: any) => sum + (m.total_cost || 0), 0)
      unitCostEquipment = (equipments || []).reduce((sum: number, e: any) => sum + (e.total_cost || 0), 0)
    }

    const unitCostTotal = unitCostLabor + unitCostMaterials + unitCostEquipment
    const totalCost = (item.quantity || 0) * unitCostTotal
    
    // Actualizar ítem y obtener todos los items en paralelo
    const [, { data: allItems }] = await Promise.all([
      supabase
        .from('budget_items')
        .update({
          unit_cost_labor: unitCostLabor,
          unit_cost_materials: unitCostMaterials,
          unit_cost_equipment: unitCostEquipment,
          unit_cost_total: unitCostTotal,
          total_cost: totalCost
        })
        .eq('id', itemId),
      supabase
        .from('budget_items')
        .select('total_cost')
        .eq('budget_id', budgetId)
    ])

    const subtotalDirectCosts = (allItems || []).reduce(
      (sum: number, i: any) => sum + (i.total_cost || 0), 0
    )

    // Recalcular totales del presupuesto
    const generalExpensesPct = budget.general_expenses_pct || 0
    const benefitPct = budget.benefit_pct || 0
    const ivaPct = budget.iva_pct || 0
    const grossIncomePct = budget.gross_income_pct || 0

    const generalExpenses = subtotalDirectCosts * (generalExpensesPct / 100)
    const subtotalWithExpenses = subtotalDirectCosts + generalExpenses
    const benefit = subtotalWithExpenses * (benefitPct / 100)
    const subtotalWithBenefit = subtotalWithExpenses + benefit
    const iva = subtotalWithBenefit * (ivaPct / 100)
    const grossIncome = subtotalWithBenefit * (grossIncomePct / 100)
    const calculatedPrice = subtotalWithBenefit + iva + grossIncome

    // Actualizar presupuesto
    await supabase
      .from('budgets')
      .update({
        subtotal_direct_costs: subtotalDirectCosts,
        subtotal_with_expenses: subtotalWithExpenses,
        subtotal_with_benefit: subtotalWithBenefit,
        calculated_price: calculatedPrice,
        final_price: calculatedPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetId)

    return this.getBudgetById(budgetId)
  }

  // Método batch para actualizar múltiples items de presupuesto de una vez
  static async updateBudgetItemsBatch(
    budgetId: string, 
    updates: { itemId: string; quantity: number }[]
  ): Promise<any> {
    if (updates.length === 0) return this.getBudgetById(budgetId)

    // 1. Actualizar todas las cantidades en paralelo
    await Promise.all(
      updates.map(({ itemId, quantity }) =>
        supabase
          .from('budget_items')
          .update({ quantity })
          .eq('id', itemId)
      )
    )

    // 2. Recalcular cada item modificado
    await Promise.all(
      updates.map(({ itemId }) => this.recalculateSingleItem(itemId))
    )

    // 3. Retornar el presupuesto actualizado
    return this.getBudgetById(budgetId)
  }

  // =====================================================
  // MÓDULO DE ARCHIVOS ADJUNTOS DE PRESUPUESTOS
  // =====================================================

  // --- Budget Attachments ---

  static async getBudgetAttachments(budgetId: string): Promise<BudgetAttachment[]> {
    const { data, error } = await supabase
      .from('budget_attachments')
      .select('*')
      .eq('budget_id', budgetId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []) as BudgetAttachment[]
  }

  static async getBudgetAttachmentById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('budget_attachments')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) return null
    return data
  }

  static async createBudgetAttachment(attachmentData: {
    budget_id: string
    filename: string
    original_name: string
    mime_type: string
    file_type: 'image' | 'pdf'
    document_type?: 'project_image' | 'technical_plan'
    size: number
    url: string
    public_id: string
    thumbnail_url?: string
    description?: string
    uploaded_by?: string
  }): Promise<any> {
    const generateId = () => {
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 15)
      return `${timestamp}-${random}`
    }

    const { data, error } = await supabase
      .from('budget_attachments')
      .insert({
        id: generateId(),
        ...attachmentData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateBudgetAttachment(id: string, attachmentData: {
    description?: string
  }): Promise<any> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (attachmentData.description !== undefined) updateData.description = attachmentData.description

    const { data, error } = await supabase
      .from('budget_attachments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteBudgetAttachment(id: string): Promise<void> {
    const { error } = await supabase
      .from('budget_attachments')
      .delete()
      .eq('id', id)
    
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

// Re-exportar tipos del módulo de presupuestos
export * from './types/budget'
