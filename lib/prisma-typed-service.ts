import { supabase } from './supabase'
import type { User, Project, Task } from './generated/prisma/index'

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
    role: 'admin' | 'supervisor' | 'operario' | 'subcontratista' | 'vendedor'
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
    role?: 'admin' | 'supervisor' | 'operario' | 'subcontratista' | 'vendedor'
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
        ),
        quote:quote_id (
          id,
          number,
          quote_type,
          status,
          client_name,
          total,
          total_ars,
          currency,
          exchange_rate,
          pdf_url
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
    status: 'planning' | 'active' | 'paused' | 'completed' | 'delivered' | 'rented'
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
    quote_id?: string
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
        module_count: projectData.module_count || 1,
        quote_id: projectData.quote_id || null
      })
      .select()
      .single()
    
    if (error) throw error
    return data as any
  }

  static async updateProject(id: string, projectData: {
    name?: string
    description?: string
    status?: 'planning' | 'active' | 'paused' | 'completed' | 'delivered' | 'rented'
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

    if (projectData.status !== undefined) {
      updateData.status = projectData.status
      if (projectData.status === 'completed') {
        const { data: current } = await supabase
          .from('projects')
          .select('completed_at')
          .eq('id', id)
          .single()
        if (!current?.completed_at) {
          updateData.completed_at = new Date().toISOString()
        }
      } else if (projectData.status === 'delivered') {
        const { data: current } = await supabase
          .from('projects')
          .select('delivered_at')
          .eq('id', id)
          .single()
        if (!current?.delivered_at) {
          updateData.delivered_at = new Date().toISOString()
        }
      } else {
        // Reactivating a project clears both terminal dates
        updateData.completed_at = null
        updateData.delivered_at = null
      }
    }

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
    category: 'estructura' | 'paneles' | 'herrajes' | 'aislacion' | 'electricidad' | 'sanitarios' | 'otros' | 'adicional'
    unit: 'unidad' | 'metro' | 'metro_cuadrado' | 'metro_cubico' | 'kilogramo' | 'litro'
    stock_quantity?: number
    min_stock?: number
    unit_price?: number
    supplier?: string
    brand?: string
    created_by?: string
  }): Promise<any> {
    const stockQuantity = materialData.stock_quantity ?? 0
    const { data, error } = await supabase
      .from('materials')
      .insert({
        ...materialData,
        stock_quantity: stockQuantity,
        min_stock: materialData.min_stock ?? 0,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error

    if (stockQuantity > 0) {
      await this.createStockMovement({
        material_id: data.id,
        type: 'in',
        quantity: stockQuantity,
        stock_after: stockQuantity,
        source_type: 'initial_stock',
        reference: 'Stock inicial',
        notes: 'Stock inicial al crear el material',
        created_by: materialData.created_by
      })
    }

    return data
  }

  static async updateMaterial(id: string, materialData: {
    code?: string
    name?: string
    description?: string
    category?: 'estructura' | 'paneles' | 'herrajes' | 'aislacion' | 'electricidad' | 'sanitarios' | 'otros' | 'adicional'
    unit?: 'unidad' | 'metro' | 'metro_cuadrado' | 'metro_cubico' | 'kilogramo' | 'litro'
    stock_quantity?: number
    min_stock?: number
    unit_price?: number
    supplier?: string
    brand?: string
    created_by?: string
  }): Promise<any> {
    const currentMaterial = await this.getMaterialById(id)
    if (!currentMaterial) throw new Error('Material no encontrado')

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

    if (materialData.stock_quantity !== undefined) {
      const currentStock = currentMaterial.stock_quantity ?? 0
      const newStock = materialData.stock_quantity
      const difference = newStock - currentStock

      if (Math.abs(difference) >= 0.0001) {
        await this.createStockMovement({
          material_id: id,
          type: difference > 0 ? 'in' : 'out',
          quantity: Math.abs(difference),
          stock_after: newStock,
          source_type: 'manual_adjustment',
          reference: 'Ajuste manual de stock',
          notes: `Stock actualizado desde ${currentStock} a ${newStock}`,
          created_by: materialData.created_by
        })
      }
    }

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

  // Stock movements helpers
  private static async createStockMovement(movement: {
    material_id: string
    type: 'in' | 'out' | 'adjustment'
    quantity: number
    stock_after: number
    source_type: 'purchase_receipt' | 'project_assignment' | 'project_removal' | 'project_update' | 'manual_adjustment' | 'initial_stock'
    source_id?: string
    reference?: string
    notes?: string
    created_by?: string
  }): Promise<void> {
    const { error } = await supabase.from('stock_movements').insert({
      material_id: movement.material_id,
      type: movement.type,
      quantity: movement.quantity,
      stock_after: movement.stock_after,
      source_type: movement.source_type,
      source_id: movement.source_id ?? null,
      reference: movement.reference ?? null,
      notes: movement.notes ?? null,
      created_by: movement.created_by ?? null,
      created_at: new Date().toISOString()
    })

    if (error) throw error
  }

  static async getStockMovementsByMaterial(materialId: string, options?: { limit?: number; offset?: number }): Promise<any[]> {
    let query = supabase
      .from('stock_movements')
      .select('*')
      .eq('material_id', materialId)
      .order('created_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async adjustMaterialStock(
    materialId: string,
    newStock: number,
    reason: string,
    createdBy?: string
  ): Promise<any> {
    const material = await this.getMaterialById(materialId)
    if (!material) throw new Error('Material no encontrado')

    const currentStock = material.stock_quantity ?? 0
    const difference = newStock - currentStock

    if (Math.abs(difference) < 0.0001) {
      return material
    }

    const { data, error } = await supabase
      .from('materials')
      .update({
        stock_quantity: newStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', materialId)
      .select()
      .single()

    if (error) throw error

    await this.createStockMovement({
      material_id: materialId,
      type: difference > 0 ? 'in' : 'out',
      quantity: Math.abs(difference),
      stock_after: newStock,
      source_type: 'manual_adjustment',
      reference: 'Ajuste manual de stock',
      notes: reason,
      created_by: createdBy
    })

    return data
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
    created_by?: string
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

    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    await this.createStockMovement({
      material_id: materialData.material_id,
      type: 'out',
      quantity: materialData.quantity,
      stock_after: newStock,
      source_type: 'project_assignment',
      source_id: data.id,
      reference: project?.name ? `Asignación a proyecto: ${project.name}` : 'Asignación a proyecto',
      notes: materialData.notes,
      created_by: materialData.created_by
    })
    
    return data
  }

  static async updateProjectMaterial(id: string, materialData: {
    quantity?: number
    unit_price?: number
    notes?: string
    created_by?: string
  }): Promise<any> {
    let stockMovement: { material_id: string; type: 'in' | 'out'; quantity: number; stock_after: number; reference: string } | null = null

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

          stockMovement = {
            material_id: material.id,
            type: 'out',
            quantity: Math.abs(difference),
            stock_after: newStock,
            reference: `Ajuste de cantidad en proyecto: ${currentQuantity} → ${newQuantity}`
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

          stockMovement = {
            material_id: material.id,
            type: 'in',
            quantity: Math.abs(difference),
            stock_after: newStock,
            reference: `Ajuste de cantidad en proyecto: ${currentQuantity} → ${newQuantity}`
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

    if (stockMovement) {
      await this.createStockMovement({
        ...stockMovement,
        source_type: 'project_update',
        source_id: data.id,
        notes: materialData.notes,
        created_by: materialData.created_by
      })
    }

    return data
  }

  static async removeMaterialFromProject(id: string, createdBy?: string): Promise<void> {
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

      await this.createStockMovement({
        material_id: material.id,
        type: 'in',
        quantity: quantityToReturn,
        stock_after: newStock,
        source_type: 'project_removal',
        source_id: id,
        reference: `Devolución desde proyecto: ${projectMaterial.project_id}`,
        created_by: createdBy
      })
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


  // ==================== MÓDULO DE COTIZADOR ====================

  static async getAllStandardModules(onlyActive = false) {
    let query = supabase
      .from('standard_modules')
      .select(`
        *,
        materials:standard_module_materials(
          *,
          material:materials(*)
        ),
        attachments:standard_module_attachments(*)
      `)
      .order('order', { ascending: true })
      .order('created_at', { ascending: false })

    if (onlyActive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  static async getStandardModuleById(id: string) {
    const { data, error } = await supabase
      .from('standard_modules')
      .select(`
        *,
        materials:standard_module_materials(
          *,
          material:materials(*)
        ),
        attachments:standard_module_attachments(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async createStandardModule(moduleData: {
    name: string
    description?: string
    base_price?: number
    is_active?: boolean
    order?: number
  }) {
    const { data, error } = await supabase
      .from('standard_modules')
      .insert(moduleData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateStandardModule(id: string, moduleData: {
    name?: string
    description?: string
    base_price?: number
    is_active?: boolean
    order?: number
    module_description?: ModuleDescriptionSection[]
  }) {
    const { data, error } = await supabase
      .from('standard_modules')
      .update({ ...moduleData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteStandardModule(id: string): Promise<void> {
    const { error } = await supabase
      .from('standard_modules')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async addStandardModuleMaterial(moduleId: string, materialId: string, quantity = 1, notes?: string) {
    const { data, error } = await supabase
      .from('standard_module_materials')
      .insert({ module_id: moduleId, material_id: materialId, quantity, notes })
      .select(`*, material:materials(*)`)
      .single()

    if (error) throw error
    return data
  }

  static async updateStandardModuleMaterial(id: string, quantity: number, notes?: string) {
    const { data, error } = await supabase
      .from('standard_module_materials')
      .update({ quantity, notes })
      .eq('id', id)
      .select(`*, material:materials(*)`)
      .single()

    if (error) throw error
    return data
  }

  static async removeStandardModuleMaterial(id: string): Promise<void> {
    const { error } = await supabase
      .from('standard_module_materials')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async createStandardModuleAttachment(attachmentData: {
    module_id: string
    filename: string
    original_name: string
    mime_type: string
    size: number
    url: string
    storage_path: string
    description?: string
  }) {
    const { data, error } = await supabase
      .from('standard_module_attachments')
      .insert(attachmentData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getStandardModuleAttachments(moduleId: string) {
    const { data, error } = await supabase
      .from('standard_module_attachments')
      .select('*')
      .eq('module_id', moduleId)

    if (error) throw error
    return data ?? []
  }

  static async deleteStandardModuleAttachment(id: string): Promise<void> {
    const { error } = await supabase
      .from('standard_module_attachments')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async getAdicionales() {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('category', 'adicional')
      .order('name', { ascending: true })

    if (error) throw error
    return data
  }

  // ==================== QUOTES ====================

  static async generateQuoteNumber(quoteType: 'sale' | 'rental' = 'sale'): Promise<string> {
    const year = new Date().getFullYear().toString()
    const prefix = quoteType === 'rental' ? `ALQ-${year}-` : `VEN-${year}-`

    const { data } = await supabase
      .from('quotes')
      .select('number')
      .like('number', `${prefix}%`)
      .order('number', { ascending: false })
      .limit(1)

    let nextNum = 1
    if (data && data.length > 0) {
      const lastNum = parseInt(data[0].number.replace(prefix, ''), 10)
      if (!isNaN(lastNum)) nextNum = lastNum + 1
    }

    return `${prefix}${nextNum.toString().padStart(4, '0')}`
  }

  static async createQuote(input: {
    number: string
    quote_type?: 'sale' | 'rental'
    client_id?: string | null
    client_name: string
    client_company?: string
    client_phone?: string
    client_email?: string
    notes?: string
    notes_list?: string[] | null
    subtotal: number
    total: number
    tax_pct?: number
    total_ars?: number
    currency?: string
    exchange_rate?: number
    exchange_rate_date?: string
    pdf_url?: string
    valid_until?: string
    created_by: string
    items: Array<{
      type: 'standard_module' | 'custom_module' | 'service'
      standard_module_id?: string
      name: string
      description?: string
      unit_price: number
      quantity: number
      subtotal: number
      is_optional?: boolean
      sort_order: number
      module_description?: { section: string; description: string }[] | null
      additionals: Array<{
        material_id?: string
        name: string
        unit_price: number
        quantity: number
        subtotal: number
      }>
      attachments?: Array<{
        filename: string
        original_name: string
        mime_type: string
        size: number
        url: string
        storage_path: string
      }>
    }>
  }): Promise<{ id: string; number: string }> {
    const validUntil = input.valid_until
      ? new Date(input.valid_until)
      : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d })()

    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        number: input.number,
        quote_type: input.quote_type ?? 'sale',
        status: 'draft',
        client_id: input.client_id ?? null,
        client_name: input.client_name,
        client_company: input.client_company ?? null,
        client_phone: input.client_phone ?? null,
        client_email: input.client_email ?? null,
        notes: input.notes ?? null,
        notes_list: input.notes_list ?? null,
        subtotal: input.subtotal,
        total: input.total,
        tax_pct: input.tax_pct ?? 21,
        total_ars: input.total_ars ?? null,
        currency: input.currency ?? 'USD',
        exchange_rate: input.exchange_rate ?? null,
        exchange_rate_date: input.exchange_rate_date ?? null,
        pdf_url: input.pdf_url ?? null,
        valid_until: validUntil.toISOString().split('T')[0],
        created_by: input.created_by,
      })
      .select('id, number')
      .single()

    if (error) throw error

    for (const item of input.items) {
      const itemPayload = {
        quote_id: quote.id,
        type: item.type,
        standard_module_id: item.standard_module_id ?? null,
        name: item.name,
        description: item.description ?? null,
        unit_price: item.unit_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        is_optional: item.is_optional ?? false,
        sort_order: item.sort_order,
        module_description: item.module_description ?? null,
      }
      console.log('[createQuote] item payload:', JSON.stringify(itemPayload))

      const { data: qItem, error: itemErr } = await supabase
        .from('quote_items')
        .insert(itemPayload)
        .select('id')
        .single()

      if (itemErr) {
        console.error('[createQuote] item insert error:', itemErr)
        throw new Error(`Failed to insert quote_item: ${itemErr.message} (${itemErr.code})`)
      }

      if (item.additionals.length > 0) {
        const addPayload = item.additionals.map((a) => ({
          quote_item_id: qItem.id,
          material_id: a.material_id ?? null,
          name: a.name,
          unit_price: a.unit_price,
          quantity: a.quantity,
          subtotal: a.subtotal,
        }))
        console.log('[createQuote] additionals payload:', JSON.stringify(addPayload))

        const { error: addErr } = await supabase
          .from('quote_item_additionals')
          .insert(addPayload)

        if (addErr) {
          console.error('[createQuote] additionals insert error:', addErr)
          throw new Error(`Failed to insert additionals: ${addErr.message} (${addErr.code})`)
        }
      }

      if (item.attachments && item.attachments.length > 0) {
        const attPayload = item.attachments.map((a) => ({
          quote_item_id: qItem.id,
          filename: a.filename,
          original_name: a.original_name,
          mime_type: a.mime_type,
          size: a.size,
          url: a.url,
          storage_path: a.storage_path,
        }))

        const { error: attErr } = await supabase
          .from('quote_item_attachments')
          .insert(attPayload)

        if (attErr) {
          console.error('[createQuote] attachments insert error:', attErr)
          throw new Error(`Failed to insert attachments: ${attErr.message} (${attErr.code})`)
        }
      }
    }

    return { id: quote.id, number: quote.number }
  }

  static async updateQuotePdfUrl(id: string, pdfUrl: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  static async replaceQuote(
    id: string,
    input: {
      quote_type?: 'sale' | 'rental'
      client_id?: string | null
      client_name: string
      client_company?: string
      client_phone?: string
      client_email?: string
      notes?: string
      notes_list?: string[] | null
      subtotal: number
      total: number
      tax_pct?: number
      total_ars?: number
      currency?: string
      exchange_rate?: number
      exchange_rate_date?: string
      valid_until?: string
      items: Array<{
        type: 'standard_module' | 'custom_module' | 'service'
        standard_module_id?: string
        name: string
        description?: string
        unit_price: number
        quantity: number
        subtotal: number
        is_optional?: boolean
        sort_order: number
        module_description?: { section: string; description: string }[] | null
        additionals: Array<{
          material_id?: string
          name: string
          unit_price: number
          quantity: number
          subtotal: number
        }>
        attachments?: Array<{
          filename: string
          original_name: string
          mime_type: string
          size: number
          url: string
          storage_path: string
        }>
      }>
    }
  ): Promise<{ id: string; number: string }> {
    // 1. Obtener el número de la cotización existente
    const { data: existing, error: existingErr } = await supabase
      .from('quotes')
      .select('number')
      .eq('id', id)
      .single()
    if (existingErr) throw existingErr

    // 2. Actualizar cabecera
    const updatePayload: Record<string, unknown> = {
      quote_type: input.quote_type ?? 'sale',
      client_id: input.client_id ?? null,
      client_name: input.client_name,
      client_company: input.client_company ?? null,
      client_phone: input.client_phone ?? null,
      client_email: input.client_email ?? null,
      notes: input.notes ?? null,
      notes_list: input.notes_list ?? null,
      subtotal: input.subtotal,
      total: input.total,
      tax_pct: input.tax_pct ?? 21,
      currency: input.currency ?? 'USD',
      exchange_rate: input.exchange_rate ?? null,
      exchange_rate_date: input.exchange_rate_date ?? null,
      updated_at: new Date().toISOString(),
    }
    if (input.valid_until) {
      updatePayload.valid_until = input.valid_until
    }
    const { error: updateErr } = await supabase
      .from('quotes')
      .update(updatePayload)
      .eq('id', id)
    if (updateErr) throw updateErr

    // 3. Eliminar items viejos (cascade elimina additionals)
    const { error: deleteErr } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', id)
    if (deleteErr) throw deleteErr

    // 4. Insertar items nuevos (mismo código que createQuote)
    for (const item of input.items) {
      const itemPayload = {
        quote_id: id,
        type: item.type,
        standard_module_id: item.standard_module_id ?? null,
        name: item.name,
        description: item.description ?? null,
        unit_price: item.unit_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        is_optional: item.is_optional ?? false,
        sort_order: item.sort_order,
        module_description: item.module_description ?? null,
      }

      const { data: qItem, error: itemErr } = await supabase
        .from('quote_items')
        .insert(itemPayload)
        .select('id')
        .single()

      if (itemErr) {
        throw new Error(`Failed to insert quote_item: ${itemErr.message} (${itemErr.code})`)
      }

      if (item.additionals.length > 0) {
        const addPayload = item.additionals.map((a) => ({
          quote_item_id: qItem.id,
          material_id: a.material_id ?? null,
          name: a.name,
          unit_price: a.unit_price,
          quantity: a.quantity,
          subtotal: a.subtotal,
        }))

        const { error: addErr } = await supabase
          .from('quote_item_additionals')
          .insert(addPayload)

        if (addErr) {
          throw new Error(`Failed to insert additionals: ${addErr.message} (${addErr.code})`)
        }
      }

      if (item.attachments && item.attachments.length > 0) {
        const attPayload = item.attachments.map((a) => ({
          quote_item_id: qItem.id,
          filename: a.filename,
          original_name: a.original_name,
          mime_type: a.mime_type,
          size: a.size,
          url: a.url,
          storage_path: a.storage_path,
        }))

        const { error: attErr } = await supabase
          .from('quote_item_attachments')
          .insert(attPayload)

        if (attErr) {
          throw new Error(`Failed to insert attachments: ${attErr.message} (${attErr.code})`)
        }
      }
    }

    return { id, number: existing.number }
  }

  static async getQuotes(userId: string, role: string, status?: string, quoteType?: string) {
    let query = supabase
      .from('quotes')
      .select('id, number, quote_type, status, client_id, client_name, client_company, client_phone, client_email, subtotal, total, tax_pct, total_ars, currency, exchange_rate, exchange_rate_date, pdf_url, valid_until, created_by, created_at, sent_at, closed_at')
      .order('created_at', { ascending: false })

    // All authorized roles (admin, supervisor, vendedor) see all quotes
    // Access control is enforced at the page/route level
    if (status) {
      query = query.eq('status', status)
    }
    if (quoteType) {
      query = query.eq('quote_type', quoteType)
    }

    const { data, error } = await query
    if (error) throw error
    
    // Obtener qué cotizaciones ya tienen proyecto asociado
    const quotes = data ?? []
    if (quotes.length > 0) {
      const { data: projectsData } = await supabase
        .from('projects')
        .select('quote_id')
        .not('quote_id', 'is', null)
      
      const quoteIdsWithProject = new Set(projectsData?.map((p: any) => p.quote_id) ?? [])
      return quotes.map((q: any) => ({ ...q, has_project: quoteIdsWithProject.has(q.id) }))
    }
    
    return quotes
  }

  static async getApprovedQuotesWithoutProject(quoteType?: 'sale' | 'rental') {
    let query = supabase
      .from('quotes')
      .select('id, number, quote_type, status, client_id, client_name, client_company, client_phone, client_email, subtotal, total, total_ars, currency, exchange_rate, exchange_rate_date, pdf_url, valid_until, created_by, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (quoteType) {
      query = query.eq('quote_type', quoteType)
    }

    const { data: quotes, error } = await query
    if (error) throw error
    if (!quotes || quotes.length === 0) return []

    // Obtener cotizaciones que ya tienen proyecto
    const { data: projectsData } = await supabase
      .from('projects')
      .select('quote_id')
      .not('quote_id', 'is', null)

    const quoteIdsWithProject = new Set(projectsData?.map((p: any) => p.quote_id) ?? [])
    return quotes.filter((q: any) => !quoteIdsWithProject.has(q.id))
  }

  static async getQuoteById(id: string) {
    // 1. Traer la cabecera
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single()

    if (quoteError) throw quoteError
    if (!quote) return null

    // 2. Traer los items
    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', id)
      .order('sort_order', { ascending: true })

    if (itemsError) throw itemsError

    // 3. Traer los additionals de todos los items
    const itemIds = items?.map((i: any) => i.id) ?? []
    let additionals: any[] = []
    if (itemIds.length > 0) {
      const { data: adds, error: addsError } = await supabase
        .from('quote_item_additionals')
        .select('*')
        .in('quote_item_id', itemIds)

      if (addsError) throw addsError
      additionals = adds ?? []
    }

    // 4. Traer los attachments de todos los items
    let attachments: any[] = []
    if (itemIds.length > 0) {
      const { data: atts, error: attsError } = await supabase
        .from('quote_item_attachments')
        .select('*')
        .in('quote_item_id', itemIds)

      if (attsError) throw attsError
      attachments = atts ?? []
    }

    // 5. Armar la estructura anidada manualmente
    const itemsWithDetails = (items ?? []).map((item: any) => ({
      ...item,
      additionals: additionals.filter((a) => a.quote_item_id === item.id),
      attachments: attachments.filter((a) => a.quote_item_id === item.id),
    }))

    return {
      ...quote,
      items: itemsWithDetails,
    }
  }

  static async updateQuoteStatus(
    id: string,
    status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
  ): Promise<void> {
    const now = new Date().toISOString()
    const extra: Record<string, string> = { updated_at: now }
    if (status === 'sent') extra.sent_at = now
    if (['approved', 'rejected', 'expired'].includes(status)) extra.closed_at = now

    const { error } = await supabase
      .from('quotes')
      .update({ status, ...extra })
      .eq('id', id)

    if (error) throw error
  }

  static async deleteQuote(id: string): Promise<void> {
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (error) throw error
  }

  // ==================== SERVICE CATALOG ====================

  static async getServiceCatalog(activeOnly = true) {
    let query = supabase.from('service_catalogs').select('*').order('name')
    if (activeOnly) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  static async createServiceCatalog(input: {
    name: string
    description?: string
    unit_price: number
    unit?: string
    is_active?: boolean
  }) {
    const { data, error } = await supabase
      .from('service_catalogs')
      .insert({
        name: input.name,
        description: input.description ?? null,
        unit_price: input.unit_price,
        unit: input.unit ?? 'unidad',
        is_active: input.is_active ?? true,
      })
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  static async updateServiceCatalog(
    id: string,
    input: {
      name?: string
      description?: string
      unit_price?: number
      unit?: string
      is_active?: boolean
    }
  ) {
    const { data, error } = await supabase
      .from('service_catalogs')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  static async deleteServiceCatalog(id: string) {
    const { error } = await supabase.from('service_catalogs').delete().eq('id', id)
    if (error) throw error
  }

  // ==================== SUPPLIERS ====================

  static async getAllSuppliers(activeOnly = true) {
    let query = supabase.from('suppliers').select('*').order('name')
    if (activeOnly) query = query.eq('is_active', true)
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  static async getSupplierById(id: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  static async createSupplier(input: {
    name: string
    contact_name?: string
    email?: string
    phone?: string
    address?: string
    cuit?: string
    notes?: string
    is_active?: boolean
  }) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({
        name: input.name,
        contact_name: input.contact_name ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        cuit: input.cuit ?? null,
        notes: input.notes ?? null,
        is_active: input.is_active ?? true,
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async updateSupplier(
    id: string,
    input: {
      name?: string
      contact_name?: string
      email?: string
      phone?: string
      address?: string
      cuit?: string
      notes?: string
      is_active?: boolean
    }
  ) {
    const { data, error } = await supabase
      .from('suppliers')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }

  static async deleteSupplier(id: string) {
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) throw error
  }

  // ==================== PURCHASE ORDERS ====================

  static async getAllPurchaseOrders(filters?: {
    status?: string
    supplier_id?: string
    search?: string
  }) {
    let query = supabase
      .from('purchase_orders')
      .select('*, supplier:suppliers(name, contact_name)')
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.supplier_id) query = query.eq('supplier_id', filters.supplier_id)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  static async getPurchaseOrderById(id: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(
        `*,
        supplier:suppliers(*),
        purchase_request:purchase_requests(id, request_number, status),
        items:purchase_order_items(*, material:materials(id, code, name, unit)),
        attachments:purchase_order_attachments(*),
        receipts:purchase_order_receipts(id, purchase_order_id, receipt_number, remito_number, remito_file_url, remito_file_name, notes, received_at)`
      )
      .eq('id', id)
      .single()

    if (error) throw error

    // Cargar ítems de recepciones por separado para evitar problemas de join
    if (data?.receipts && data.receipts.length > 0) {
      const receiptIds = data.receipts.map((r: any) => r.id)
      const { data: receiptItems, error: itemsError } = await supabase
        .from('purchase_order_receipt_items')
        .select('id, receipt_id, purchase_order_item_id, material_id, description, quantity_received, material:materials(id, code, name, unit)')
        .in('receipt_id', receiptIds)

      if (itemsError) throw itemsError

      const itemsByReceipt: Record<string, any[]> = {}
      for (const item of receiptItems || []) {
        if (!itemsByReceipt[item.receipt_id]) itemsByReceipt[item.receipt_id] = []
        itemsByReceipt[item.receipt_id].push(item)
      }

      data.receipts = data.receipts.map((r: any) => ({
        ...r,
        items: itemsByReceipt[r.id] || [],
      }))
    }

    return data
  }

  static async getNextPurchaseOrderNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `OC-${year}-`

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('order_number')
      .ilike('order_number', `${prefix}%`)
      .order('order_number', { ascending: false })
      .limit(1)

    if (error) throw error

    let nextNum = 1
    if (data && data.length > 0) {
      const last = data[0].order_number as string
      const match = last.match(/-(\d+)$/)
      if (match) nextNum = parseInt(match[1], 10) + 1
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`
  }

  static async createPurchaseOrder(input: {
    order_number: string
    supplier_id: string
    purchase_request_id?: string
    status?: string
    subtotal?: number
    tax_pct?: number
    tax_amount?: number
    total?: number
    payment_terms?: string
    delivery_terms?: string
    delivery_date?: string
    notes?: string
    created_by?: string
    items: Array<{
      material_id?: string
      description: string
      quantity: number
      unit: string
      unit_price: number
      total_price: number
    }>
  }) {
    const { items, ...orderData } = input

    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        order_number: orderData.order_number,
        supplier_id: orderData.supplier_id,
        purchase_request_id: orderData.purchase_request_id ?? null,
        status: orderData.status ?? 'draft',
        subtotal: orderData.subtotal ?? 0,
        tax_pct: orderData.tax_pct ?? 21,
        tax_amount: orderData.tax_amount ?? 0,
        total: orderData.total ?? 0,
        payment_terms: orderData.payment_terms ?? null,
        delivery_terms: orderData.delivery_terms ?? null,
        delivery_date: orderData.delivery_date ?? null,
        notes: orderData.notes ?? null,
        created_by: orderData.created_by ?? null,
      })
      .select('*')
      .single()

    if (orderError) throw orderError

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('purchase_order_items').insert(
        items.map((item) => ({
          purchase_order_id: order.id,
          material_id: item.material_id ?? null,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }))
      )
      if (itemsError) throw itemsError
    }

    return this.getPurchaseOrderById(order.id)
  }

  static async updatePurchaseOrder(
    id: string,
    input: {
      supplier_id?: string
      purchase_request_id?: string | null
      status?: string
      subtotal?: number
      tax_pct?: number
      tax_amount?: number
      total?: number
      payment_terms?: string
      delivery_terms?: string
      delivery_date?: string
      notes?: string
      items?: Array<{
        id?: string
        material_id?: string
        description: string
        quantity: number
        unit: string
        unit_price: number
        total_price: number
      }>
    }
  ) {
    const { items, ...orderData } = input

    const updatePayload: Record<string, unknown> = {
      ...orderData,
      updated_at: new Date().toISOString(),
    }
    if (orderData.purchase_request_id === null) {
      updatePayload.purchase_request_id = null
    }

    const { error: orderError } = await supabase
      .from('purchase_orders')
      .update(updatePayload)
      .eq('id', id)

    if (orderError) throw orderError

    if (items) {
      // Obtener items actuales para hacer upsert y preservar recepciones
      const { data: existingItems, error: fetchError } = await supabase
        .from('purchase_order_items')
        .select('id')
        .eq('purchase_order_id', id)

      if (fetchError) throw fetchError

      const existingIds = new Set((existingItems || []).map((i: any) => i.id))
      const sentIds = new Set(items.map((item) => item.id).filter(Boolean) as string[])

      // Actualizar items existentes
      const itemsToUpdate = items.filter((item) => item.id && existingIds.has(item.id))
      for (const item of itemsToUpdate) {
        const { error: updateError } = await supabase
          .from('purchase_order_items')
          .update({
            material_id: item.material_id ?? null,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            total_price: item.total_price,
          })
          .eq('id', item.id)

        if (updateError) throw updateError
      }

      // Insertar items nuevos
      const itemsToInsert = items.filter((item) => !item.id || !existingIds.has(item.id))
      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from('purchase_order_items').insert(
          itemsToInsert.map((item) => ({
            purchase_order_id: id,
            material_id: item.material_id ?? null,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            total_price: item.total_price,
          }))
        )
        if (itemsError) throw itemsError
      }

      // Borrar items que ya no están en la lista, SOLO si no tienen recepciones asociadas
      const itemsToDelete = (existingItems || []).filter((i: any) => !sentIds.has(i.id))
      if (itemsToDelete.length > 0) {
        const itemIdsToDelete = itemsToDelete.map((i: any) => i.id)

        const { data: receiptItems, error: riError } = await supabase
          .from('purchase_order_receipt_items')
          .select('purchase_order_item_id')
          .in('purchase_order_item_id', itemIdsToDelete)

        if (riError) throw riError

        const idsWithReceipts = new Set((receiptItems || []).map((ri: any) => ri.purchase_order_item_id))
        const deletableIds = itemIdsToDelete.filter((id: string) => !idsWithReceipts.has(id))

        if (deletableIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('purchase_order_items')
            .delete()
            .in('id', deletableIds)

          if (deleteError) throw deleteError
        }
      }
    }

    return this.getPurchaseOrderById(id)
  }

  static async deletePurchaseOrder(id: string) {
    // Los attachments e items se eliminan en cascada por la DB
    const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
    if (error) throw error
  }

  static async updatePurchaseOrderStatus(
    id: string,
    status: 'draft' | 'pending' | 'approved' | 'partial_received' | 'received' | 'cancelled'
  ) {
    const now = new Date().toISOString()
    const updateData: Record<string, unknown> = { status, updated_at: now }

    if (status === 'received') {
      updateData.received_at = now
    }

    const { error } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
  }

  // ==================== PURCHASE REQUESTS ====================

  static async getAllPurchaseRequests(filters?: { status?: string; search?: string }) {
    let query = supabase
      .from('purchase_requests')
      .select(
        `*,
        items:purchase_request_items(*, material:materials(id, code, name, unit, brand)),
        supplier_quotes:supplier_quotes(*, supplier:suppliers(id, name)),
        purchase_orders:purchase_orders(id, order_number, status, total)`
      )
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query
    if (error) throw error

    if (filters?.search && data) {
      const term = filters.search.toLowerCase()
      return data.filter((r: any) =>
        r.request_number?.toLowerCase().includes(term) ||
        r.notes?.toLowerCase().includes(term)
      )
    }

    return data ?? []
  }

  static async getPurchaseRequestById(id: string) {
    const { data, error } = await supabase
      .from('purchase_requests')
      .select(
        `*,
        items:purchase_request_items(*, material:materials(id, code, name, unit, brand)),
        supplier_quotes:supplier_quotes(*, supplier:suppliers(id, name, contact_name)),
        purchase_orders:purchase_orders(id, order_number, status, total, supplier:suppliers(id, name))`
      )
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  static async getNextPurchaseRequestNumber(): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `PED-${year}-`

    const { data, error } = await supabase
      .from('purchase_requests')
      .select('request_number')
      .ilike('request_number', `${prefix}%`)
      .order('request_number', { ascending: false })
      .limit(1)

    if (error) throw error

    let nextNum = 1
    if (data && data.length > 0) {
      const last = data[0].request_number as string
      const match = last.match(/-(\d+)$/)
      if (match) nextNum = parseInt(match[1], 10) + 1
    }

    return `${prefix}${String(nextNum).padStart(4, '0')}`
  }

  static async createPurchaseRequest(input: {
    request_number?: string
    status?: string
    notes?: string
    created_by?: string
    items: Array<{
      material_id?: string
      description: string
      quantity: number
      unit: string
    }>
  }) {
    const { items, ...requestData } = input
    const requestNumber = requestData.request_number ?? (await this.getNextPurchaseRequestNumber())

    const { data: request, error: requestError } = await supabase
      .from('purchase_requests')
      .insert({
        request_number: requestNumber,
        status: requestData.status ?? 'draft',
        notes: requestData.notes ?? null,
        created_by: requestData.created_by ?? null,
      })
      .select('*')
      .single()

    if (requestError) throw requestError

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from('purchase_request_items').insert(
        items.map((item) => ({
          purchase_request_id: request.id,
          material_id: item.material_id ?? null,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
        }))
      )
      if (itemsError) throw itemsError
    }

    return this.getPurchaseRequestById(request.id)
  }

  static async updatePurchaseRequest(
    id: string,
    input: {
      status?: string
      notes?: string
      items?: Array<{
        id?: string
        material_id?: string
        description: string
        quantity: number
        unit: string
      }>
    }
  ) {
    const { items, ...requestData } = input

    const { error: requestError } = await supabase
      .from('purchase_requests')
      .update({
        ...requestData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (requestError) throw requestError

    if (items) {
      const { error: deleteError } = await supabase
        .from('purchase_request_items')
        .delete()
        .eq('purchase_request_id', id)
      if (deleteError) throw deleteError

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('purchase_request_items').insert(
          items.map((item) => ({
            purchase_request_id: id,
            material_id: item.material_id ?? null,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
          }))
        )
        if (itemsError) throw itemsError
      }
    }

    return this.getPurchaseRequestById(id)
  }

  static async deletePurchaseRequest(id: string) {
    const { error } = await supabase.from('purchase_requests').delete().eq('id', id)
    if (error) throw error
  }

  // ==================== SUPPLIER QUOTES ====================

  static async getSupplierQuotesByPurchaseRequest(purchaseRequestId: string) {
    const { data, error } = await supabase
      .from('supplier_quotes')
      .select('*, supplier:suppliers(*)')
      .eq('purchase_request_id', purchaseRequestId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  static async getSupplierQuoteById(id: string) {
    const { data, error } = await supabase
      .from('supplier_quotes')
      .select('*, supplier:suppliers(*), purchase_request:purchase_requests(id, request_number)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  static async createSupplierQuote(input: {
    purchase_request_id: string
    supplier_id: string
    total?: number
    quote_date?: string
    valid_until?: string
    file_url?: string
    file_name?: string
    status?: string
    notes?: string
  }) {
    const { data, error } = await supabase
      .from('supplier_quotes')
      .insert({
        purchase_request_id: input.purchase_request_id,
        supplier_id: input.supplier_id,
        total: input.total ?? 0,
        quote_date: input.quote_date ?? null,
        valid_until: input.valid_until ?? null,
        file_url: input.file_url ?? null,
        file_name: input.file_name ?? null,
        status: input.status ?? 'draft',
        notes: input.notes ?? null,
      })
      .select('*')
      .single()

    if (error) throw error
    return this.getSupplierQuoteById(data.id)
  }

  static async updateSupplierQuote(
    id: string,
    input: {
      supplier_id?: string
      total?: number
      quote_date?: string
      valid_until?: string
      file_url?: string
      file_name?: string
      status?: string
      notes?: string
    }
  ) {
    const updateData: Record<string, unknown> = {
      ...input,
      updated_at: new Date().toISOString(),
    }
    if (input.file_url === null) updateData.file_url = null
    if (input.file_name === null) updateData.file_name = null

    const { error } = await supabase
      .from('supplier_quotes')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
    return this.getSupplierQuoteById(id)
  }

  static async deleteSupplierQuote(id: string) {
    const { error } = await supabase.from('supplier_quotes').delete().eq('id', id)
    if (error) throw error
  }

  // ==================== PURCHASE ORDER RECEIPTS ====================

  static async getPurchaseOrderReceipts(purchaseOrderId: string) {
    const { data: receipts, error } = await supabase
      .from('purchase_order_receipts')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('received_at', { ascending: false })

    if (error) throw error
    if (!receipts || receipts.length === 0) return []

    const receiptIds = receipts.map((r: any) => r.id)
    const { data: receiptItems, error: itemsError } = await supabase
      .from('purchase_order_receipt_items')
      .select('id, receipt_id, purchase_order_item_id, material_id, description, quantity_received, material:materials(id, code, name, unit)')
      .in('receipt_id', receiptIds)

    if (itemsError) throw itemsError

    const itemsByReceipt: Record<string, any[]> = {}
    for (const item of receiptItems || []) {
      if (!itemsByReceipt[item.receipt_id]) itemsByReceipt[item.receipt_id] = []
      itemsByReceipt[item.receipt_id].push(item)
    }

    return receipts.map((r: any) => ({
      ...r,
      items: itemsByReceipt[r.id] || [],
    }))
  }

  static async createPurchaseOrderReceipt(input: {
    purchase_order_id: string
    receipt_number?: string
    remito_number?: string
    remito_file_url?: string
    remito_file_name?: string
    notes?: string
    created_by?: string
    items: Array<{
      purchase_order_item_id: string
      material_id?: string
      description: string
      quantity_received: number
    }>
  }) {
    const { items, ...receiptData } = input

    console.log('[createPurchaseOrderReceipt] input:', JSON.stringify(input, null, 2))

    const { data: purchaseOrder, error: purchaseOrderError } = await supabase
      .from('purchase_orders')
      .select('order_number')
      .eq('id', receiptData.purchase_order_id)
      .single()

    if (purchaseOrderError) throw purchaseOrderError

    const { data: receipt, error: receiptError } = await supabase
      .from('purchase_order_receipts')
      .insert({
        purchase_order_id: receiptData.purchase_order_id,
        receipt_number: receiptData.receipt_number ?? null,
        remito_number: receiptData.remito_number ?? null,
        remito_file_url: receiptData.remito_file_url ?? null,
        remito_file_name: receiptData.remito_file_name ?? null,
        notes: receiptData.notes ?? null,
      })
      .select('*')
      .single()

    console.log('[createPurchaseOrderReceipt] receipt insert result:', { receipt, receiptError })

    if (receiptError) throw receiptError
    if (!receipt) throw new Error('No se pudo crear la recepción')

    if (items.length > 0) {
      // Buscar ítems actuales de la orden para resolver IDs correctos
      const { data: currentOrderItems, error: orderItemsError } = await supabase
        .from('purchase_order_items')
        .select('id, material_id, description, quantity')
        .eq('purchase_order_id', receiptData.purchase_order_id)

      if (orderItemsError) throw orderItemsError

      console.log('[createPurchaseOrderReceipt] currentOrderItems:', JSON.stringify(currentOrderItems, null, 2))

      const receiptItemsPayload = items.map((item) => {
        // Intentar encontrar el ítem actual por material_id + description
        const matchingItem = currentOrderItems?.find(
          (oi: any) =>
            oi.material_id === (item.material_id ?? null) &&
            oi.description === item.description
        )

        const resolvedPurchaseOrderItemId = matchingItem?.id || item.purchase_order_item_id

        return {
          receipt_id: receipt.id,
          purchase_order_item_id: resolvedPurchaseOrderItemId,
          material_id: item.material_id ?? null,
          description: item.description,
          quantity_received: item.quantity_received,
        }
      })

      console.log('[createPurchaseOrderReceipt] receiptItemsPayload:', JSON.stringify(receiptItemsPayload, null, 2))

      const { data: insertedItems, error: itemsError } = await supabase
        .from('purchase_order_receipt_items')
        .insert(receiptItemsPayload)
        .select()

      console.log('[createPurchaseOrderReceipt] receipt items insert result:', { insertedItems, itemsError })

      if (itemsError) {
        // Si falla la inserción de ítems, borrar la recepción huérfana
        console.error('[createPurchaseOrderReceipt] items insert failed, deleting orphan receipt:', receipt.id)
        await supabase.from('purchase_order_receipts').delete().eq('id', receipt.id)
        throw itemsError
      }

      // Actualizar stock y registrar movimientos por cada ítem con material_id
      for (const item of items) {
        if (!item.material_id) continue

        const { data: material, error: materialError } = await supabase
          .from('materials')
          .select('stock_quantity')
          .eq('id', item.material_id)
          .single()

        if (materialError) throw materialError

        const newStock = (material.stock_quantity ?? 0) + (item.quantity_received ?? 0)
        const { error: updateError } = await supabase
          .from('materials')
          .update({ stock_quantity: newStock })
          .eq('id', item.material_id)

        if (updateError) throw updateError

        await this.createStockMovement({
          material_id: item.material_id,
          type: 'in',
          quantity: item.quantity_received ?? 0,
          stock_after: newStock,
          source_type: 'purchase_receipt',
          source_id: receipt.id,
          reference: `Recepción ${purchaseOrder?.order_number || ''}`.trim(),
          notes: receiptData.notes,
          created_by: input.created_by
        })
      }
    }

    // Recalcular estado de la orden según cantidades recibidas
    await this.recalculatePurchaseOrderStatus(receiptData.purchase_order_id)

    const finalReceipt = await this.getPurchaseOrderReceiptById(receipt.id)
    console.log('[createPurchaseOrderReceipt] final receipt:', JSON.stringify(finalReceipt, null, 2))

    return finalReceipt
  }

  static async getPurchaseOrderReceiptById(id: string) {
    // Traer recepción e ítems por separado para evitar problemas de join
    const { data: receipt, error: receiptError } = await supabase
      .from('purchase_order_receipts')
      .select('*')
      .eq('id', id)
      .single()

    if (receiptError) throw receiptError

    const { data: receiptItems, error: itemsError } = await supabase
      .from('purchase_order_receipt_items')
      .select('id, receipt_id, purchase_order_item_id, material_id, description, quantity_received, material:materials(id, code, name, unit)')
      .eq('receipt_id', id)

    if (itemsError) throw itemsError

    return {
      ...receipt,
      items: receiptItems || [],
    }
  }

  static async deletePurchaseOrderReceipt(id: string, createdBy?: string) {
    // Obtener ítems para ajustar stock (restar lo recibido)
    const { data: receipt, error: fetchError } = await supabase
      .from('purchase_order_receipts')
      .select('purchase_order_id, items:purchase_order_receipt_items(material_id, quantity_received)')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const { data: purchaseOrder } = await supabase
      .from('purchase_orders')
      .select('order_number')
      .eq('id', receipt.purchase_order_id)
      .single()

    if (receipt?.items) {
      for (const item of receipt.items as any[]) {
        if (!item.material_id) continue

        const { data: material, error: materialError } = await supabase
          .from('materials')
          .select('stock_quantity')
          .eq('id', item.material_id)
          .single()

        if (materialError) throw materialError

        const newStock = Math.max(0, (material.stock_quantity ?? 0) - (item.quantity_received ?? 0))
        const { error: updateError } = await supabase
          .from('materials')
          .update({ stock_quantity: newStock })
          .eq('id', item.material_id)

        if (updateError) throw updateError

        await this.createStockMovement({
          material_id: item.material_id,
          type: 'out',
          quantity: item.quantity_received ?? 0,
          stock_after: newStock,
          source_type: 'purchase_receipt',
          source_id: id,
          reference: `Anulación de recepción ${purchaseOrder?.order_number || ''}`.trim(),
          created_by: createdBy
        })
      }
    }

    const purchaseOrderId = receipt.purchase_order_id
    const { error } = await supabase.from('purchase_order_receipts').delete().eq('id', id)
    if (error) throw error

    await this.recalculatePurchaseOrderStatus(purchaseOrderId)
  }

  static async recalculatePurchaseOrderStatus(purchaseOrderId: string) {
    // Obtener ítems de la orden con cantidad pedida
    const { data: orderItems, error: itemsError } = await supabase
      .from('purchase_order_items')
      .select('id, quantity')
      .eq('purchase_order_id', purchaseOrderId)

    if (itemsError) throw itemsError
    if (!orderItems || orderItems.length === 0) return

    // Obtener TODAS las recepciones de la orden para sumar correctamente
    // incluso si los IDs de ítems cambiaron por ediciones previas
    const { data: receipts, error: receiptsError } = await supabase
      .from('purchase_order_receipts')
      .select('id')
      .eq('purchase_order_id', purchaseOrderId)

    if (receiptsError) throw receiptsError

    let totalReceived = 0
    if (receipts && receipts.length > 0) {
      const receiptIds = receipts.map((r: any) => r.id)
      const { data: receivedItems, error: receivedError } = await supabase
        .from('purchase_order_receipt_items')
        .select('quantity_received')
        .in('receipt_id', receiptIds)

      if (receivedError) throw receivedError

      totalReceived = (receivedItems || []).reduce(
        (sum: number, ri: any) => sum + (ri.quantity_received ?? 0),
        0
      )
    }

    const totalOrdered = orderItems.reduce((sum: number, i: any) => sum + (i.quantity ?? 0), 0)

    // Redondear para evitar problemas de punto flotante
    const round4 = (n: number) => Math.round(n * 10000) / 10000
    const orderedRounded = round4(totalOrdered)
    const receivedRounded = round4(totalReceived)

    console.log('[recalculatePurchaseOrderStatus]', { purchaseOrderId, orderedRounded, receivedRounded })

    let newStatus: string | null = null
    if (receivedRounded <= 0) {
      newStatus = 'approved'
    } else if (receivedRounded >= orderedRounded) {
      newStatus = 'received'
    } else {
      newStatus = 'partial_received'
    }

    const updateData: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() }
    if (newStatus === 'received') {
      const { data: current } = await supabase
        .from('purchase_orders')
        .select('received_at')
        .eq('id', purchaseOrderId)
        .single()
      if (!current?.received_at) {
        updateData.received_at = new Date().toISOString()
      }
    } else {
      updateData.received_at = null
    }

    const { error } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', purchaseOrderId)

    if (error) throw error
  }

  // ==================== RENTAL MODULES ====================

  static async getRentalModules(filters?: { status?: string; project_id?: string }) {
    let query = supabase
      .from('rental_modules')
      .select(`
        *,
        project:projects(id, name),
        current_contract:rental_contracts!rental_modules_current_contract_id_fkey(id, status, start_date, end_date, client:clients(id, company_name))
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.project_id) query = query.eq('project_id', filters.project_id)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  static async getRentalModuleById(id: string) {
    const { data, error } = await supabase
      .from('rental_modules')
      .select(`
        *,
        project:projects(id, name, status, client:clients(id, company_name)),
        contracts:rental_contracts!rental_contracts_rental_module_id_fkey(
          *,
          client:clients(id, company_name, representative, phone, email),
          quote:quotes(id, number, total)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async createRentalModule(input: {
    code: string
    name: string
    description?: string
    project_id?: string
    modulation?: string
    height?: number
    width?: number
    depth?: number
    module_count?: number
    status?: string
    location?: string
    condition?: string
    notes?: string
  }) {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('rental_modules')
      .insert({
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        project_id: input.project_id ?? null,
        modulation: input.modulation ?? 'standard',
        height: input.height ?? 2.0,
        width: input.width ?? 1.5,
        depth: input.depth ?? 0.8,
        module_count: input.module_count ?? 1,
        status: input.status ?? 'available',
        condition: input.condition ?? null,
        notes: input.notes ?? null,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  static async updateRentalModule(
    id: string,
    input: {
      code?: string
      name?: string
      description?: string
      project_id?: string | null
      modulation?: string
      height?: number
      width?: number
      depth?: number
      module_count?: number
      status?: string
      location?: string
      condition?: string
      notes?: string
      current_contract_id?: string | null
    }
  ) {
    const updateData: any = { ...input, updated_at: new Date().toISOString() }
    if (input.project_id === undefined) delete updateData.project_id
    if (input.current_contract_id === undefined) delete updateData.current_contract_id

    const { data, error } = await supabase
      .from('rental_modules')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  // ==================== RENTAL CONTRACTS ====================

  static async getRentalContracts(filters?: { status?: string; rental_module_id?: string; client_id?: string }) {
    let query = supabase
      .from('rental_contracts')
      .select(`
        *,
        rental_module:rental_modules!rental_contracts_rental_module_id_fkey(id, code, name),
        client:clients(id, company_name, representative),
        quote:quotes(id, number, total)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.rental_module_id) query = query.eq('rental_module_id', filters.rental_module_id)
    if (filters?.client_id) query = query.eq('client_id', filters.client_id)

    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  static async getRentalContractById(id: string) {
    const { data, error } = await supabase
      .from('rental_contracts')
      .select(`
        *,
        rental_module:rental_modules!rental_contracts_rental_module_id_fkey(id, code, name, project:projects(id, name)),
        client:clients(id, company_name, representative, phone, email, cuit),
        quote:quotes(id, number, total, currency),
        created_by_user:users(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async createRentalContract(input: {
    rental_module_id: string
    client_id: string
    quote_id?: string
    start_date: Date
    end_date?: Date
    delivery_date?: Date
    monthly_price: number
    deposit_amount?: number
    currency?: string
    delivery_notes?: string
    created_by: string
  }) {
    const now = new Date().toISOString()
    const { data: contract, error: contractError } = await supabase
      .from('rental_contracts')
      .insert({
        rental_module_id: input.rental_module_id,
        client_id: input.client_id,
        quote_id: input.quote_id ?? null,
        start_date: input.start_date.toISOString(),
        end_date: input.end_date ? input.end_date.toISOString() : null,
        delivery_date: input.delivery_date ? input.delivery_date.toISOString() : null,
        monthly_price: input.monthly_price,
        deposit_amount: input.deposit_amount ?? null,
        currency: input.currency ?? 'USD',
        status: 'active',
        delivery_notes: input.delivery_notes ?? null,
        created_by: input.created_by,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single()

    if (contractError) throw contractError

    // Update module status to rented and link current contract
    const { error: moduleError } = await supabase
      .from('rental_modules')
      .update({
        status: 'rented',
        current_contract_id: contract.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.rental_module_id)

    if (moduleError) throw moduleError

    return contract
  }

  static async updateRentalContract(
    id: string,
    input: {
      client_id?: string
      quote_id?: string | null
      start_date?: Date
      end_date?: Date | null
      delivery_date?: Date | null
      return_date?: Date | null
      monthly_price?: number
      deposit_amount?: number | null
      currency?: string
      status?: string
      delivery_notes?: string
      return_notes?: string
    }
  ) {
    const updateData: any = { updated_at: new Date().toISOString() }
    if (input.client_id !== undefined) updateData.client_id = input.client_id
    if (input.quote_id !== undefined) updateData.quote_id = input.quote_id
    if (input.start_date !== undefined) updateData.start_date = input.start_date.toISOString()
    if (input.end_date !== undefined) updateData.end_date = input.end_date ? input.end_date.toISOString() : null
    if (input.delivery_date !== undefined) updateData.delivery_date = input.delivery_date ? input.delivery_date.toISOString() : null
    if (input.return_date !== undefined) updateData.return_date = input.return_date ? input.return_date.toISOString() : null
    if (input.monthly_price !== undefined) updateData.monthly_price = input.monthly_price
    if (input.deposit_amount !== undefined) updateData.deposit_amount = input.deposit_amount
    if (input.currency !== undefined) updateData.currency = input.currency
    if (input.status !== undefined) updateData.status = input.status
    if (input.delivery_notes !== undefined) updateData.delivery_notes = input.delivery_notes
    if (input.return_notes !== undefined) updateData.return_notes = input.return_notes

    const { data, error } = await supabase
      .from('rental_contracts')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  static async returnRentalContract(id: string, input: { return_date: Date; return_notes?: string }) {
    const now = new Date().toISOString()

    // Get contract to find module
    const { data: contract, error: fetchError } = await supabase
      .from('rental_contracts')
      .select('rental_module_id')
      .eq('id', id)
      .single()

    if (fetchError || !contract) throw fetchError || new Error('Contrato no encontrado')

    // Update contract
    const { data: updatedContract, error: contractError } = await supabase
      .from('rental_contracts')
      .update({
        status: 'returned',
        return_date: input.return_date.toISOString(),
        return_notes: input.return_notes ?? null,
        updated_at: now,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (contractError) throw contractError

    // Free up module
    const { error: moduleError } = await supabase
      .from('rental_modules')
      .update({
        status: 'available',
        current_contract_id: null,
        updated_at: now,
      })
      .eq('id', contract.rental_module_id)

    if (moduleError) throw moduleError

    return updatedContract
  }
}

export type {
  User,
  Project,
  Task,
  ProjectOperario,
  UserRole,
  ProjectStatus,
  ProjectPriority,
  TaskStatus,
  TaskPriority,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderAttachment,
  PurchaseOrderStatus,
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseRequestStatus,
  SupplierQuote,
  PurchaseOrderReceipt,
  PurchaseOrderReceiptItem,
} from './generated/prisma/index'

// Re-exportar tipos del módulo de presupuestos
