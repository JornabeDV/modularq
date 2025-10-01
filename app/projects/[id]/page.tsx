"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, Users, FolderOpen } from "lucide-react"
import { TaskSelfAssignment } from "@/components/operario/task-self-assignment"
import { useProjects } from "@/hooks/use-projects"
import { useProjectTasks } from "@/hooks/use-project-tasks"
import { useProjectOperarios } from "@/hooks/use-project-operarios"
import { useAuth } from "@/lib/auth-context"

interface ProjectDetailPageProps {
  params: {
    id: string
  }
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading: projectsLoading } = useProjects()
  const { projectTasks, refetch: refetchTasks } = useProjectTasks(params.id)
  const { projectOperarios, loading: operariosLoading } = useProjectOperarios(params.id)
  const [project, setProject] = useState<any>(null)

  useEffect(() => {
    if (projects.length > 0) {
      const foundProject = projects.find(p => p.id === params.id)
      setProject(foundProject || null)
    }
  }, [projects, params.id])

  // Verificar si el operario está asignado al proyecto
  const isAssignedToProject = projectOperarios.some(po => po.userId === user?.id)

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
    
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    })
  }

  if (projectsLoading || operariosLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando proyecto...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">Proyecto no encontrado</h2>
            <p className="text-muted-foreground mt-2">El proyecto solicitado no existe</p>
            <Button 
              onClick={() => router.push('/projects')} 
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Proyectos
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!operariosLoading && !isAssignedToProject) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive">Acceso Denegado</h2>
            <p className="text-muted-foreground mt-2">
              No tienes acceso a este proyecto. Contacta con tu administrador.
            </p>
            <Button 
              onClick={() => router.push('/projects')} 
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Proyectos
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const completedTasks = projectTasks.filter(task => task.status === 'completed').length
  const totalTasks = projectTasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/projects')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
          </div>
          <Badge variant="default">
            Activo
          </Badge>
        </div>

        {/* Project Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Información del Proyecto</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fecha de Inicio</span>
                  <span className="text-lg font-semibold">{formatDate(project.startDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fecha de Finalización</span>
                  <span className="text-lg font-semibold">{formatDate(project.endDate)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progreso</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completado</span>
                  <span className="text-lg font-semibold">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Totales</span>
                  <span className="text-lg font-semibold">{totalTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">En progreso</span>
                  <span className="text-lg font-semibold text-blue-600">{projectTasks.filter(task => task.status === 'in_progress').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Terminadas</span>
                  <span className="text-lg font-semibold text-green-600">{completedTasks}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task Self Assignment */}
        <TaskSelfAssignment 
          projectTasks={projectTasks} 
          projectId={params.id}
          onTaskUpdate={refetchTasks}
        />
      </div>
    </MainLayout>
  )
}
