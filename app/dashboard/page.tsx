"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { mockProjects, mockOperarios, mockTasks } from "@/lib/mock-data"
import { FolderKanban, Users, Clock, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

export default function DashboardPage() {
  const activeProjects = mockProjects.filter((p) => p.status === "active")
  const totalOperarios = mockOperarios.length
  const activeTasks = mockTasks.filter((t) => t.status === "in-progress").length
  const completedTasks = mockTasks.filter((t) => t.status === "completed").length
  const pendingTasks = mockTasks.filter((t) => t.status === "pending").length
  const blockedTasks = mockTasks.filter((t) => t.status === "blocked").length

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
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general del sistema de gestión de operarios</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
              <p className="text-xs text-muted-foreground">de {mockProjects.length} proyectos totales</p>
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
                {Math.round(mockOperarios.reduce((acc, op) => acc + op.efficiency, 0) / mockOperarios.length)}%
              </div>
              <p className="text-xs text-muted-foreground">promedio general</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects and Tasks Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Proyectos Activos</CardTitle>
              <CardDescription>Estado actual de los proyectos en curso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeProjects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <Badge variant={getPriorityColor(project.priority)}>{project.priority}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progreso</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {project.assignedOperarios.length} operarios asignados
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Task Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Tareas</CardTitle>
              <CardDescription>Distribución actual de tareas por estado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Completadas</span>
                </div>
                <span className="text-2xl font-bold text-green-500">{completedTasks}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">En Progreso</span>
                </div>
                <span className="text-2xl font-bold text-blue-500">{activeTasks}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Pendientes</span>
                </div>
                <span className="text-2xl font-bold text-yellow-500">{pendingTasks}</span>
              </div>

              {blockedTasks > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Bloqueadas</span>
                  </div>
                  <span className="text-2xl font-bold text-red-500">{blockedTasks}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas actualizaciones del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Tarea completada</p>
                  <p className="text-xs text-muted-foreground">
                    María García completó "Control de calidad inicial" hace 2 horas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Nuevo proyecto iniciado</p>
                  <p className="text-xs text-muted-foreground">
                    "Línea de Producción A" cambió a estado activo hace 1 día
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Operario asignado</p>
                  <p className="text-xs text-muted-foreground">
                    Carlos López fue asignado a "Instalación sistema hidráulico" hace 3 días
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
