"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { OperarioOnly } from "@/components/auth/route-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Users, DollarSign, MoreHorizontal, FolderOpen, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUserProjectsPrisma } from "@/hooks/use-user-projects-prisma"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export default function ProjectsPage() {
  return (
    <OperarioOnly>
      <ProjectsContent />
    </OperarioOnly>
  )
}

function ProjectsContent() {
  const { user } = useAuth()
  const { projects, loading, error } = useUserProjectsPrisma(user?.id)
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "planning":
        return "secondary"
      case "paused":
        return "outline"
      case "completed":
        return "secondary"
      default:
        return "secondary"
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha"
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Filtrar proyectos activos (ya vienen filtrados por usuario)
  const activeProjects = projects.filter(p => p.status === "active")
  

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando proyectos...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-destructive">Error</h2>
              <p className="text-muted-foreground mt-2">{error}</p>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-balance">Proyectos Activos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Proyectos en curso</p>
          </div>
          <div className="text-sm text-muted-foreground flex items-center">
            {activeProjects.length} proyecto{activeProjects.length !== 1 ? 's' : ''} activo{activeProjects.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {activeProjects.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay proyectos activos</h3>
              <p className="text-muted-foreground mb-4">
                No hay proyectos en estado activo en este momento.
              </p>
            </div>
          ) : (
            activeProjects.map((project) => {
              const completedTasks = project.projectTasks.filter((task: any) => task.status === 'completed').length
              const totalTasks = project.projectTasks.length
              const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

              return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                    <CardDescription className="mb-3">
                      {project.description}
                    </CardDescription>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">
                        Activo
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {totalTasks} tarea{totalTasks !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progreso del proyecto */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progreso del proyecto</span>
                    <span className="font-medium">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                {/* Información del proyecto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Inicio:</span>
                    <span className="truncate">{formatDate(project.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fin:</span>
                    <span className="truncate">{formatDate(project.endDate)}</span>
                  </div>
                </div>


                {/* Botón para ver detalles */}
                <div className="pt-2 border-t">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" className="w-full text-sm sm:text-base">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles del Proyecto
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
              )
            })
          )}
        </div>

      </div>
    </MainLayout>
  )
}