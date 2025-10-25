"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Users, Calendar, FolderOpen, Edit, Trash2, Zap, ClipboardList, Settings } from 'lucide-react'
import { ProjectForm } from './project-form'
import { TaskRow } from './task-row'
import { TaskForm } from './task-form'
import { DeleteProjectButton } from './delete-project-button'
import { ProjectTaskManager } from './project-task-manager'
import { ProjectOperariosManager } from './project-operarios-manager'
import { FileUpload } from '@/components/projects/file-upload'
import { useProjectsPrisma } from '@/hooks/use-projects-prisma'
import { useProjectTasksPrisma } from '@/hooks/use-project-tasks-prisma'
import { useTasksPrisma } from '@/hooks/use-tasks-prisma'
import { useUsersPrisma } from '@/hooks/use-users-prisma'
import { useProjectFiles } from '@/hooks/use-project-files'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import type { Project, ProjectTask, Task } from '@/lib/types'

interface ProjectDetailProps {
  projectId: string
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter()
  const { user, userProfile } = useAuth()
  const { projects, loading: projectsLoading, error: projectsError, updateProject, deleteProject, refetch: refetchProjects } = useProjectsPrisma()
  const { projectTasks, loading: projectTasksLoading, createProjectTask, updateProjectTask, deleteProjectTask, updateTaskOrder, assignStandardTaskToProject } = useProjectTasksPrisma(projectId)
  const { tasks: allTasks, createTask } = useTasksPrisma()
  const { users } = useUsersPrisma()
  const { files: projectFiles, loading: filesLoading } = useProjectFiles(
    projectId, 
    user?.id || '',
    userProfile?.role === 'admin' || userProfile?.role === 'supervisor'
  )
  
  const [project, setProject] = useState<Project | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null)
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false)
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)

  useEffect(() => {
    if (projects.length > 0) {
      const foundProject = projects.find(p => p.id === projectId)
      setProject(foundProject || null)
      
    }
  }, [projects, projectId])


  const handleUpdateProject = async (projectData: Partial<Project>) => {
    if (!project) return
    
    // Mapear los datos del formulario al formato esperado por el hook
    const mappedData = {
      name: projectData.name,
      description: projectData.description,
      status: projectData.status,
      start_date: projectData.startDate ? new Date(projectData.startDate) : undefined,
      end_date: projectData.endDate ? new Date(projectData.endDate) : undefined,
      client_id: projectData.clientId,
      // Especificaciones técnicas
      modulation: projectData.modulation,
      height: projectData.height,
      width: projectData.width,
      depth: projectData.depth,
      module_count: projectData.moduleCount
    }
    
    
    const result = await updateProject(project.id, mappedData)
    if (result.success) {
      setIsEditDialogOpen(false)
    } else {
      console.error('❌ Error actualizando proyecto:', result.error)
    }
  }

  const handleActivateProject = () => {
    setIsActivateDialogOpen(true)
  }

  const confirmActivateProject = async () => {
    if (!project) return
    
    const result = await updateProject(project.id, { 
      status: 'active',
      start_date: new Date() // Establecer fecha de inicio al activar
    })
    
    if (result.success) {
      setIsActivateDialogOpen(false)
      // El proyecto se actualizará automáticamente gracias al refetch
    }
  }

  const handleDeactivateProject = () => {
    setIsDeactivateDialogOpen(true)
  }

  const confirmDeactivateProject = async () => {
    if (!project) return
    
    const result = await updateProject(project.id, { 
      status: 'planning'
      // No modificamos la fecha de inicio para mantener el historial
    })
    
    if (result.success) {
      setIsDeactivateDialogOpen(false)
      // El proyecto se actualizará automáticamente gracias al refetch
    }
  }

  const handleDeleteProject = async () => {
    if (!project) return
    await deleteProject(project.id)
    router.push('/admin/projects')
  }

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) return

    try {
      // Primero crear la tarea base
      const { data: createdTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          estimated_hours: taskData.estimatedHours,
          category: taskData.category,
          type: taskData.type || 'custom',
          created_by: user.id
        })
        .select()
        .single()

      if (taskError) {
        console.error('Error creating task:', taskError)
        return
      }

      // Luego asignarla al proyecto
      const projectTaskResult = await createProjectTask({
        projectId: project!.id,
        taskId: createdTask.id, // Usar el ID de la tarea recién creada
        assignedBy: user.id
      })
      
      if (projectTaskResult.success) {
        setIsTaskDialogOpen(false)
      }
    } catch (error) {
      console.error('Error in handleCreateTask:', error)
    }
  }

  const handleUpdateTask = async (projectTaskId: string, taskData: Partial<ProjectTask>) => {
    // Filtrar solo los campos que acepta el hook
    const updateData: any = {}
    if (taskData.status !== undefined) updateData.status = taskData.status
    if (taskData.actualHours !== undefined) updateData.actualHours = taskData.actualHours
    if (taskData.progressPercentage !== undefined) updateData.progressPercentage = taskData.progressPercentage
    if (taskData.notes !== undefined) updateData.notes = taskData.notes
    if (taskData.startDate !== undefined) updateData.startDate = taskData.startDate
    if (taskData.endDate !== undefined) updateData.endDate = taskData.endDate
    if (taskData.assignedTo !== undefined) updateData.assignedTo = taskData.assignedTo
    
    const result = await updateProjectTask(projectTaskId, updateData)
    if (result.success) {
      setEditingTask(null)
    }
  }

  const handleDeleteTask = async (projectTaskId: string) => {
    await deleteProjectTask(projectTaskId)
  }

  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task)
  }

  const handleAssignTask = async (taskId: string) => {
    if (!user?.id) return
    
    const result = await createProjectTask({
      projectId: project!.id,
      taskId: taskId,
      assignedBy: user.id
    })
    
    if (result.success) {
      // Tarea asignada exitosamente
    }
  }

  const handleUnassignTask = async (projectTaskId: string) => {
    const result = await deleteProjectTask(projectTaskId)
    
    if (result.success) {
      // Tarea desasignada exitosamente
    }
  }

  const handleReorderTasks = async (taskOrders: { id: string; taskOrder: number }[]) => {
    const result = await updateTaskOrder(taskOrders)
    
    if (result.success) {
      // Orden de tareas actualizado exitosamente
    } else {
      console.error('Error actualizando orden de tareas:', result.error)
    }
  }

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'planning': { label: 'Planificación', color: 'secondary' as const },
      'active': { label: 'Activo', color: 'default' as const },
      'paused': { label: 'En Pausa', color: 'destructive' as const },
      'completed': { label: 'Completado', color: 'default' as const },
      'cancelled': { label: 'Cancelado', color: 'destructive' as const }
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: 'default' as const }
  }


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    
    // Si la fecha viene en formato ISO (YYYY-MM-DD), la parseamos directamente
    // para evitar problemas de zona horaria
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
    
    // Para fechas con timestamp o formato ISO completo, usar el método normal
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC' // Forzar UTC para evitar cambios de zona horaria
    })
  }

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (projectsError || !project) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Proyecto no encontrado</h2>
          <p className="text-muted-foreground mt-2">
            {projectsError || 'El proyecto solicitado no existe'}
          </p>
          <Button 
            onClick={() => router.push('/admin/projects')} 
            className="mt-4 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Proyectos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/projects')}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </DialogTrigger>
          </Dialog>
          {project.status === 'planning' && (
            <Button 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              size="sm"
              onClick={handleActivateProject}
            >
              <Zap className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">¡Activar Proyecto!</span>
              <span className="sm:hidden">Activar</span>
            </Button>
          )}
          {project.status === 'active' && (
            <Button 
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              size="sm"
              onClick={handleDeactivateProject}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Volver a Planificación
            </Button>
          )}
          {project.status !== 'active' && (
            <DeleteProjectButton
              projectId={project.id}
              projectName={project.name}
              onDelete={handleDeleteProject}
            />
          )}
          {project.status === 'active' && (
            <div className="hidden sm:block text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
              <strong>Proyecto Activo</strong>
            </div>
          )}
        </div>
      </div>

      {/* Project Status Indicator - Solo móvil */}
      {project.status === 'active' && (
        <div className="flex justify-start sm:hidden">
          <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md inline-block">
            <strong>Proyecto Activo</strong>
          </div>
        </div>
      )}

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Información del Proyecto</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Creado</label>
                <p className="text-sm">{formatDate(project.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Última Actualización</label>
                <p className="text-sm">{formatDate(project.updatedAt)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Fecha de Inicio</label>
                <p className="text-sm">{formatDate(project.startDate)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Fecha de Finalización</label>
                <p className="text-sm">{formatDate(project.endDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusInfo(project.status).color}>
                {getStatusInfo(project.status).label}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectTasks.length}</div>
              <p className="text-xs text-muted-foreground">tareas asignadas</p>
            </CardContent>
          </Card>

          {/* Files Statistics Card - Solo para admins y supervisores */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'supervisor') && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Archivos</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectFiles.length}</div>
                <p className="text-xs text-muted-foreground">
                  archivo{projectFiles.length !== 1 ? 's' : ''} subido{projectFiles.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Especificaciones Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Especificaciones Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Modulación</Label>
              <p className="text-sm font-medium">{project.modulation}</p>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Medidas</Label>
              <p className="text-sm font-medium">
                <span className="text-muted-foreground">Alto:</span> {project.height}m • 
                <span className="text-muted-foreground"> Ancho:</span> {project.width}m • 
                <span className="text-muted-foreground"> Profundidad:</span> {project.depth}m
              </p>
            </div>
            
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Módulos</Label>
              <p className="text-sm font-medium">{project.moduleCount} módulos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Operarios Manager */}
      <ProjectOperariosManager projectId={project.id} />

      {/* Project Files Manager - Solo para admins y supervisores */}
      {(userProfile?.role === 'admin' || userProfile?.role === 'supervisor') && (
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Archivos del Proyecto
              </CardTitle>
              <CardDescription>
                Gestiona documentos PDF, Excel y otros archivos relacionados con este proyecto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                projectId={project.id}
                userId={user?.id || ''}
                existingFiles={projectFiles}
              />
            </CardContent>
          </Card>
      )}

      {/* Project Task Manager */}
      <ProjectTaskManager
        projectId={project.id}
        projectTasks={projectTasks}
        projectStatus={project.status}
        onAssignTask={handleAssignTask}
        onUnassignTask={handleUnassignTask}
        onEditTask={handleEditTask}
        onCreateTask={() => setIsTaskDialogOpen(true)}
        onReorderTasks={handleReorderTasks}
      />

      {/* Edit Project Dialog */}
      <ProjectForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSubmit={handleUpdateProject}
        isEditing={true}
        initialData={project}
      />

      {/* Create Task Dialog */}
      <TaskForm
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        onSubmit={handleCreateTask}
        isEditing={false}
        projectId={project.id}
      />

      {/* Edit Project Task Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tarea del Proyecto</DialogTitle>
              <DialogDescription>
                Actualiza la evolución de esta tarea en el proyecto
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tarea</label>
                <p className="text-sm text-muted-foreground">{editingTask.task?.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <Select value={editingTask.status} onValueChange={(value) => setEditingTask({...editingTask, status: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="assigned">Asignada</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="completed">Completada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Horas Reales</label>
                <Input
                  type="number"
                  value={editingTask.actualHours}
                  onChange={(e) => setEditingTask({...editingTask, actualHours: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Progreso (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editingTask.progressPercentage}
                  onChange={(e) => setEditingTask({...editingTask, progressPercentage: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Textarea
                  value={editingTask.notes || ''}
                  onChange={(e) => setEditingTask({...editingTask, notes: e.target.value})}
                  placeholder="Notas adicionales sobre la tarea..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTask(null)} className="cursor-pointer">
                Cancelar
              </Button>
              <Button onClick={() => {
                const updateData = {
                  status: editingTask.status,
                  actualHours: editingTask.actualHours,
                  progressPercentage: editingTask.progressPercentage,
                  notes: editingTask.notes
                }
                handleUpdateTask(editingTask.id, updateData)
              }} className="cursor-pointer">
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Confirmación para Activar Proyecto */}
      <Dialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Activar Proyecto
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres activar este proyecto?
            </DialogDescription>
          </DialogHeader>
          

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsActivateDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white cursor-pointer"
              onClick={confirmActivateProject}
            >
              <Zap className="h-4 w-4 mr-2" />
              Sí, Activar Proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación para Desactivar Proyecto */}
      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-orange-600" />
              Volver a Planificación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres volver este proyecto a estado de planificación?
            </DialogDescription>
          </DialogHeader>
          

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeactivateDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button 
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white cursor-pointer"
              onClick={confirmDeactivateProject}
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Sí, Volver a Planificación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}