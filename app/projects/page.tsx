"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, Calendar, Users, DollarSign, MoreHorizontal, FolderOpen } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useProjects } from "@/hooks/use-projects"
import Link from "next/link"

export default function ProjectsPage() {
  const { projects, loading, error } = useProjects()
  
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

  // Filtrar proyectos por estado
  const activeProjects = projects.filter(p => p.status === "active")
  const planningProjects = projects.filter(p => p.status === "planning")
  const completedProjects = projects.filter(p => p.status === "completed")

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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Proyectos</h1>
            <p className="text-muted-foreground">Gestión y seguimiento de todos los proyectos</p>
          </div>
          <Link href="/admin/projects">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Gestionar Proyectos
            </Button>
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primer proyecto desde la administración
              </p>
              <Link href="/admin/projects">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Proyecto
                </Button>
              </Link>
            </div>
          ) : (
            projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(project.status)}>
                        {project.status === "active" ? "Activo" : 
                         project.status === "planning" ? "Planificación" :
                         project.status === "on-hold" ? "En Pausa" :
                         project.status === "completed" ? "Completado" :
                         project.status === "cancelled" ? "Cancelado" : project.status}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/admin/projects/${project.id}`}>
                        <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                      </Link>
                      <Link href="/admin/projects">
                        <DropdownMenuItem>Gestionar</DropdownMenuItem>
                      </Link>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="text-sm">{project.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Project Info */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(project.startDate)} - {project.endDate ? formatDate(project.endDate) : "Sin fecha"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{project.tasks.length} tareas asignadas</span>
                  </div>

                  {project.supervisor && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Supervisor: {project.supervisor}</span>
                    </div>
                  )}

                  {project.department && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FolderOpen className="h-4 w-4" />
                      <span>Dept: {project.department}</span>
                    </div>
                  )}
                </div>

                {/* Tasks Summary */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tareas del Proyecto:</p>
                  <div className="text-sm text-muted-foreground">
                    {project.tasks.length > 0 ? (
                      <span>{project.tasks.length} tareas asignadas</span>
                    ) : (
                      <span>Sin tareas asignadas</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {completedProjects.length}
                </div>
                <p className="text-sm text-muted-foreground">Completados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {activeProjects.length}
                </div>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {planningProjects.length}
                </div>
                <p className="text-sm text-muted-foreground">En Planificación</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {projects.filter((p) => p.status === "on-hold").length}
                </div>
                <p className="text-sm text-muted-foreground">Pausados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}