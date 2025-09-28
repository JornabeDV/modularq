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
import { ArrowLeft, Plus, Users, Calendar, FolderOpen, Edit, Trash2 } from 'lucide-react'
import { ProjectForm } from './project-form'
import { TaskRow } from './task-row'
import { TaskForm } from './task-form'
import { DeleteProjectButton } from './delete-project-button'
import { ProjectTaskManager } from './project-task-manager'
import { useProjects } from '@/hooks/use-projects'
import { useProjectTasks } from '@/hooks/use-project-tasks'
import { useTasks } from '@/hooks/use-tasks'
import { useUsers } from '@/hooks/use-users'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import type { Project, ProjectTask, Task } from '@/lib/types'

interface ProjectDetailProps {
  projectId: string
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading: projectsLoading, error: projectsError, updateProject, deleteProject, refetch: refetchProjects } = useProjects()
  const { projectTasks, loading: projectTasksLoading, createProjectTask, updateProjectTask, deleteProjectTask, updateTaskOrder, assignStandardTaskToProject } = useProjectTasks(projectId)
  const { tasks: allTasks, createTask } = useTasks()
  const { users } = useUsers()
  
  const [project, setProject] = useState<Project | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null)

  useEffect(() => {
    if (projects.length > 0) {
      const foundProject = projects.find(p => p.id === projectId)
      setProject(foundProject || null)
    }
  }, [projects, projectId])


  const handleUpdateProject = async (projectData: Partial<Project>) => {
    if (!project) return
    
    const result = await updateProject(project.id, projectData)
    if (result.success) {
      setIsEditDialogOpen(false)
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
    console.log('Updating project task:', projectTaskId, taskData)
    const result = await updateProjectTask(projectTaskId, taskData)
    console.log('Update result:', result)
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
      console.log('Tarea asignada exitosamente')
    }
  }

  const handleUnassignTask = async (projectTaskId: string) => {
    const result = await deleteProjectTask(projectTaskId)
    
    if (result.success) {
      console.log('Tarea desasignada exitosamente')
    }
  }

  const handleReorderTasks = async (taskOrders: { id: string; taskOrder: number }[]) => {
    const result = await updateTaskOrder(taskOrders)
    
    if (result.success) {
      console.log('Orden de tareas actualizado exitosamente')
    } else {
      console.error('Error actualizando orden de tareas:', result.error)
    }
  }

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'planning': { label: 'Planificación', color: 'secondary' as const },
      'active': { label: 'Activo', color: 'default' as const },
      'on-hold': { label: 'En Pausa', color: 'destructive' as const },
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
            className="mt-4"
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
          {project.status !== 'active' ? (
            <>
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Proyecto
                  </Button>
                </DialogTrigger>
              </Dialog>
              <DeleteProjectButton
                projectId={project.id}
                projectName={project.name}
                onDelete={handleDeleteProject}
              />
            </>
          ) : (
            <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
              <strong>Proyecto Activo</strong>
            </div>
          )}
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
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
      </div>

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
                <label className="text-sm font-medium">Asignado a</label>
                <Select value={editingTask.assignedTo || ''} onValueChange={(value) => setEditingTask({...editingTask, assignedTo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id || ''}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                const updateData = {
                  status: editingTask.status,
                  actualHours: editingTask.actualHours,
                  progressPercentage: editingTask.progressPercentage,
                  assignedTo: editingTask.assignedTo,
                  notes: editingTask.notes
                }
                handleUpdateTask(editingTask.id, updateData)
              }}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  )
}