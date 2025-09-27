"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Plus, Users, Calendar, FolderOpen, Edit, Trash2 } from 'lucide-react'
import { ProjectForm } from './project-form'
import { TaskRow } from './task-row'
import { TaskForm } from './task-form'
import { DeleteProjectButton } from './delete-project-button'
import { useProjects } from '@/hooks/use-projects'
import { useTasks } from '@/hooks/use-tasks'
import { useUsers } from '@/hooks/use-users'
import { useAuth } from '@/lib/auth-context'
import type { Project, Task } from '@/lib/types'

interface ProjectDetailProps {
  projectId: string
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading: projectsLoading, error: projectsError, updateProject, deleteProject } = useProjects()
  const { tasks, createTask, updateTask, deleteTask } = useTasks()
  const { users } = useUsers()
  
  const [project, setProject] = useState<Project | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

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

    const result = await createTask({
      ...taskData,
      projectId: project.id,
      createdBy: user.id
    })
    
    if (result.success) {
      setIsTaskDialogOpen(false)
    }
  }

  const handleUpdateTask = async (taskId: string, taskData: Partial<Task>) => {
    const result = await updateTask(taskId, taskData)
    if (result.success) {
      setEditingTask(null)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  // Filtrar tareas del proyecto
  const projectTasks = tasks.filter(task => task.projectId === projectId)

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'planning': { label: 'Planificación', color: 'secondary' as const },
      'active': { label: 'Activo', color: 'default' as const },
      'on-hold': { label: 'En Pausa', color: 'destructive' as const },
      'completed': { label: 'Completado', color: 'success' as const },
      'cancelled': { label: 'Cancelado', color: 'destructive' as const }
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: 'default' as const }
  }


  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
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
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Project Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tareas del Proyecto</CardTitle>
                <CardDescription>
                  Gestiona las tareas asignadas a este proyecto
                </CardDescription>
              </div>
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Tarea
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-background">
                    <TableHead className="min-w-[200px]">Tarea</TableHead>
                    <TableHead className="text-center min-w-[120px]">Categoría</TableHead>
                    <TableHead className="text-center min-w-[100px]">Horas Est.</TableHead>
                    <TableHead className="text-center min-w-[100px]">Horas Real</TableHead>
                    <TableHead className="text-center min-w-[150px]">Asignado a</TableHead>
                    <TableHead className="text-center min-w-[120px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay tareas asignadas a este proyecto
                      </td>
                    </tr>
                  ) : (
                    projectTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        users={users}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Inicio</label>
              <p className="text-sm">{formatDate(project.startDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Fecha de Fin</label>
              <p className="text-sm">{formatDate(project.endDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Creado</label>
              <p className="text-sm">{formatDate(project.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Última Actualización</label>
              <p className="text-sm">{formatDate(project.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Edit Task Dialog */}
      <TaskForm
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={(data) => editingTask && handleUpdateTask(editingTask.id, data)}
        isEditing={true}
        initialData={editingTask}
        projectId={project.id}
      />
    </div>
  )
}
