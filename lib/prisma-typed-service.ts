import { supabase } from './supabase'
import type { User, Project, Task } from './generated/prisma/index'

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
    // Solo actualizar password si está definido y no está vacío
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

  // Proyectos con tipos de Prisma
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
          assigned_by,
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
        ),
        project_operarios (
          id,
          project_id,
          user_id,
          assigned_at,
          assigned_by,
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
    status: 'planning' | 'active' | 'paused' | 'completed'
    start_date: Date
    end_date?: Date
    client_id?: string
    created_by?: string
    // Especificaciones técnicas
    modulation?: string
    height?: number
    width?: number
    depth?: number
    module_count?: number
  }): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        description: projectData.description,
        status: projectData.status,
        start_date: projectData.start_date.toISOString(),
        end_date: projectData.end_date?.toISOString(),
        client_id: projectData.client_id,
        created_by: projectData.created_by,
        progress: 0,
        // Especificaciones técnicas
        modulation: projectData.modulation || 'standard',
        height: projectData.height || 2.0,
        width: projectData.width || 1.5,
        depth: projectData.depth || 0.8,
        module_count: projectData.module_count || 1
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
    client_id?: string
    progress?: number
    project_order?: number
    // Especificaciones técnicas
    modulation?: string
    height?: number
    width?: number
    depth?: number
    module_count?: number
  }): Promise<Project> {
    const updateData: any = {}
    
    if (projectData.name !== undefined) updateData.name = projectData.name
    if (projectData.description !== undefined) updateData.description = projectData.description
    if (projectData.status !== undefined) updateData.status = projectData.status
    if (projectData.start_date !== undefined) updateData.start_date = projectData.start_date.toISOString()
    if (projectData.end_date !== undefined) updateData.end_date = projectData.end_date.toISOString()
    if (projectData.client_id !== undefined) updateData.client_id = projectData.client_id
    if (projectData.progress !== undefined) updateData.progress = projectData.progress
    if (projectData.project_order !== undefined) updateData.project_order = projectData.project_order
    // Especificaciones técnicas
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
    // Obtener el siguiente orden
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
    // Actualizar cada tarea con su nuevo orden
    const updatePromises = taskOrders.map(({ id, task_order }) =>
      supabase
        .from('tasks')
        .update({ task_order })
        .eq('id', id)
    )
    
    const results = await Promise.all(updatePromises)
    
    // Verificar si alguna actualización falló
    const hasErrors = results.some(result => result.error)
    if (hasErrors) {
      throw new Error('Error al actualizar el orden de las tareas')
    }
  }

  // Project Operarios
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
    assigned_by?: string
  }): Promise<any> {
    const { data, error } = await supabase
      .from('project_operarios')
      .insert({
        project_id: assignmentData.project_id,
        user_id: assignmentData.user_id,
        assigned_by: assignmentData.assigned_by
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

  // Project Tasks
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
    status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
    estimated_hours?: number  // Tiempo estimado total para este proyecto
    actual_hours?: number
    assigned_to?: string
    start_date?: string
    end_date?: string
    progress_percentage?: number
    notes?: string
    assigned_by?: string
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
      assigned_by: projectTaskData.assigned_by
    }
    
    // Solo incluir estimated_hours si se proporciona
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
    status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
    estimated_hours?: number
    actual_hours?: number
    assigned_to?: string
    start_date?: string
    end_date?: string
    progress_percentage?: number
    notes?: string
    task_order?: number
  }): Promise<any> {
    const updateData: any = {}
    
    if (projectTaskData.status !== undefined) updateData.status = projectTaskData.status
    if (projectTaskData.estimated_hours !== undefined) updateData.estimated_hours = projectTaskData.estimated_hours
    if (projectTaskData.actual_hours !== undefined) updateData.actual_hours = projectTaskData.actual_hours
    if (projectTaskData.assigned_to !== undefined) updateData.assigned_to = projectTaskData.assigned_to
    if (projectTaskData.start_date !== undefined) updateData.start_date = projectTaskData.start_date
    if (projectTaskData.end_date !== undefined) updateData.end_date = projectTaskData.end_date
    if (projectTaskData.progress_percentage !== undefined) updateData.progress_percentage = projectTaskData.progress_percentage
    if (projectTaskData.notes !== undefined) updateData.notes = projectTaskData.notes
    if (projectTaskData.task_order !== undefined) updateData.task_order = projectTaskData.task_order

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

  // User Projects
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
          assigned_by,
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

  // Obtener estadísticas de operario
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

  // Clientes con tipos de Prisma
  static async getAllClients(): Promise<any[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
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
    representative: string
    email: string
    phone: string
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
    // Primero verificar si hay proyectos asociados
    const { data: projects, error: checkError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('client_id', id)
    
    if (checkError) throw checkError
    
    if (projects && projects.length > 0) {
      throw new Error(`No se puede eliminar el cliente porque tiene ${projects.length} proyecto(s) asociado(s). Primero debe desasociar o eliminar los proyectos.`)
    }
    
    // Si no hay proyectos asociados, proceder con la eliminación
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
    // Mapeo de categorías a prefijos
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
    
    // Buscar el último código de esta categoría
    const { data, error } = await supabase
      .from('materials')
      .select('code')
      .like('code', `${prefix}-%`)
      .order('code', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    let nextNumber = 1
    
    if (data && data.length > 0) {
      // Extraer el número del último código (ej: "EST-042" -> 42)
      const lastCode = data[0].code
      const match = lastCode.match(/-(\d+)$/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }
    
    // Formatear con ceros a la izquierda (001, 002, etc.)
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
        min_stock: materialData.min_stock ?? 0
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
    // Primero verificar si hay proyectos asociados
    const { data: projectMaterials, error: checkError } = await supabase
      .from('project_materials')
      .select('id')
      .eq('material_id', id)
    
    if (checkError) throw checkError
    
    if (projectMaterials && projectMaterials.length > 0) {
      throw new Error(`No se puede eliminar el material porque está asignado a ${projectMaterials.length} proyecto(s). Primero debe desasociar el material de los proyectos.`)
    }
    
    // Si no hay proyectos asociados, proceder con la eliminación
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
    // Primero verificar que hay stock suficiente
    const material = await this.getMaterialById(materialData.material_id)
    if (!material) {
      throw new Error('Material no encontrado')
    }
    
    const currentStock = material.stock_quantity ?? 0
    if (currentStock < materialData.quantity) {
      throw new Error(`Stock insuficiente. Disponible: ${currentStock} ${material.unit}, Requerido: ${materialData.quantity} ${material.unit}`)
    }
    
    // Usar transacción para asegurar consistencia
    // 1. Descontar stock del material
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
    
    // 2. Crear la relación proyecto-material
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
      // Si falla la inserción, revertir el descuento de stock
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
    // Si se está actualizando la cantidad, ajustar el stock
    if (materialData.quantity !== undefined) {
      // Obtener la información actual
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
        
        // Si se está aumentando la cantidad, verificar stock y descontar
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
        // Si se está disminuyendo la cantidad, devolver stock
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
    
    // Actualizar la relación proyecto-material
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
    // Primero obtener la información del material asignado para devolver el stock
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
    
    // Devolver el stock al material
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
    
    // Eliminar la relación proyecto-material
    const { error } = await supabase
      .from('project_materials')
      .delete()
      .eq('id', id)
    
    if (error) throw error
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
} from './generated/prisma/index'