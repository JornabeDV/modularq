"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { mockProjects, mockOperarios } from "@/lib/mock-data"
import { Plus, Calendar, Users, DollarSign, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function ProjectsPage() {
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

  const getOperarioName = (id: string) => {
    return mockOperarios.find((op) => op.id === id)?.name || "Desconocido"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
                      <Badge variant={getPriorityColor(project.priority)}>{project.priority}</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Asignar operarios</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="text-sm">{project.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Progreso</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

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
                    <span>{project.assignedOperarios.length} operarios asignados</span>
                  </div>

                  {project.budget && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatCurrency(project.budget)}</span>
                    </div>
                  )}
                </div>

                {/* Assigned Operarios */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Operarios Asignados:</p>
                  <div className="flex flex-wrap gap-1">
                    {project.assignedOperarios.map((operarioId) => (
                      <Badge key={operarioId} variant="outline" className="text-xs">
                        {getOperarioName(operarioId)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Department and Supervisor */}
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  <p>Departamento: {project.department}</p>
                  <p>Supervisor: {project.supervisor}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {mockProjects.filter((p) => p.status === "completed").length}
                </div>
                <p className="text-sm text-muted-foreground">Completados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {mockProjects.filter((p) => p.status === "active").length}
                </div>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {mockProjects.filter((p) => p.status === "planning").length}
                </div>
                <p className="text-sm text-muted-foreground">En Planificación</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {mockProjects.filter((p) => p.status === "paused").length}
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
