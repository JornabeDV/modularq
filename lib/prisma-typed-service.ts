import { supabase } from './supabase'
import type { User, Project, Task } from './generated/prisma/index'

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
