"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useProjects } from "@/hooks/use-projects"
import { useOperarios } from "@/hooks/use-operarios"
import { AdminOnly } from "@/components/auth/route-guard"
import { FolderKanban, Users, Clock, TrendingUp, AlertTriangle, CheckCircle, UserPlus, Shield, Settings } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { userProfile } = useAuth()
  const { projects, loading: projectsLoading } = useProjects()
  const { operarios } = useOperarios()
  
  // Calcular datos reales del dashboard
  const activeProjects = projects.filter(p => p.status === 'active')
  const totalOperarios = operarios.length
  const activeTasks = projects.reduce((sum, project) => 
    sum + project.projectTasks.filter(pt => pt.status === 'in_progress').length, 0
  )
  const completedTasks = projects.reduce((sum, project) => 
    sum + project.projectTasks.filter(pt => pt.status === 'completed').length, 0
  )
  const pendingTasks = projects.reduce((sum, project) => 
    sum + project.projectTasks.filter(pt => pt.status === 'pending').length, 0
  )
  const cancelledTasks = projects.reduce((sum, project) => 
    sum + project.projectTasks.filter(pt => pt.status === 'cancelled').length, 0
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "planning":
        return "bg-blue-500"
      case "paused":
        return "bg-yellow-500"
      case "completed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <AdminOnly>
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-balance">Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {userProfile?.role === 'admin' 
                ? 'Panel de administración - Gestión completa del sistema'
                : 'Resumen general del sistema de gestión de operarios'
              }
            </p>
          </div>
          
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
              <p className="text-xs text-muted-foreground">de 0 proyectos totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOperarios}</div>
              <p className="text-xs text-muted-foreground">operarios registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Activas</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTasks}</div>
              <p className="text-xs text-muted-foreground">tareas en progreso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                0%
              </div>
              <p className="text-xs text-muted-foreground">promedio general</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Section */}
        {userProfile?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Panel de Administración
              </CardTitle>
              <CardDescription>Gestión de usuarios y control del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Control de Usuarios</h3>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Crea, edita y gestiona todos los usuarios del sistema
                  </p>
                  <Link href="/admin/users">
                    <Button size="sm" className="w-full">
                      <Users className="h-3 w-3 mr-1" />
                      Gestionar Usuarios
                    </Button>
                  </Link>
                </div>
                
                <div className="p-4 border rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Estadísticas del Sistema</h3>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Monitorea el rendimiento y actividad del sistema
                    </p>
                  </div>
                  <Link href="/reports">
                    <Button size="sm" variant="outline" className="w-full">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Ver Reportes
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Proyectos Activos</CardTitle>
                <CardDescription>Estado actual de los proyectos en curso</CardDescription>
              </div>
              <Link href="/admin/projects">
                <Button variant="outline" className="gap-2">
                  <FolderKanban className="h-4 w-4" />
                  Gestionar Proyectos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando proyectos...</p>
                </div>
              </div>
            ) : activeProjects.length > 0 ? (
              activeProjects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <Badge variant="default">{project.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progreso</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.projectTasks.length} tareas asignadas
                  </p>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No hay proyectos activos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comienza creando tu primer proyecto para gestionar las tareas de los operarios
                </p>
                <Link href="/admin/projects">
                  <Button className="gap-2">
                    <FolderKanban className="h-4 w-4" />
                    Crear Proyecto
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        </div>
      </MainLayout>
    </AdminOnly>
  )
}