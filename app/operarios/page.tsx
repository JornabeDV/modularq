"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { mockOperarios, mockTasks } from "@/lib/mock-data"
import { Plus, Clock, TrendingUp, Mail, Wrench } from "lucide-react"

export default function OperariosPage() {
  const getOperarioTasks = (operarioId: string) => {
    return mockTasks.filter((task) => task.assignedTo === operarioId)
  }

  const getOperarioStats = (operarioId: string) => {
    const tasks = getOperarioTasks(operarioId)
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "completed").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      pending: tasks.filter((t) => t.status === "pending").length,
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Operarios</h1>
            <p className="text-muted-foreground">Gestión del personal y asignación de tareas</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Operario
          </Button>
        </div>

        {/* Operarios Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockOperarios.map((operario) => {
            const stats = getOperarioStats(operario.id)
            const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

            return (
              <Card key={operario.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="text-lg font-semibold">
                        {operario.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{operario.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {operario.email}
                      </CardDescription>
                      <Badge variant="outline" className="mt-2">
                        {operario.department}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Efficiency */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Eficiencia
                      </span>
                      <span className="font-medium">{operario.efficiency}%</span>
                    </div>
                    <Progress value={operario.efficiency} className="h-2" />
                  </div>

                  {/* Task Statistics */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-green-500">{stats.completed}</div>
                      <p className="text-muted-foreground">Completadas</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold text-blue-500">{stats.inProgress}</div>
                      <p className="text-muted-foreground">En Progreso</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Wrench className="h-4 w-4" />
                      Habilidades
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {operario.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Hours and Completion Rate */}
                  <div className="pt-2 border-t space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Horas totales
                      </span>
                      <span className="font-medium">{operario.totalHours}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tasa de finalización</span>
                      <span className="font-medium">{Math.round(completionRate)}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Ver Tareas
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        Asignar Tarea
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Operarios</span>
                <span className="text-2xl font-bold">{mockOperarios.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Eficiencia Promedio</span>
                <span className="text-2xl font-bold">
                  {Math.round(mockOperarios.reduce((acc, op) => acc + op.efficiency, 0) / mockOperarios.length)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Horas Totales</span>
                <span className="text-2xl font-bold">{mockOperarios.reduce((acc, op) => acc + op.totalHours, 0)}h</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Por Departamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from(new Set(mockOperarios.map((op) => op.department))).map((dept) => {
                const count = mockOperarios.filter((op) => op.department === dept).length
                return (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-sm">{dept}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Carga de Trabajo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockOperarios.map((operario) => {
                const activeTasks = mockTasks.filter(
                  (t) => t.assignedTo === operario.id && (t.status === "in-progress" || t.status === "pending"),
                ).length

                return (
                  <div key={operario.id} className="flex items-center justify-between">
                    <span className="text-sm truncate">{operario.name}</span>
                    <Badge variant={activeTasks > 2 ? "destructive" : activeTasks > 1 ? "default" : "secondary"}>
                      {activeTasks} tareas
                    </Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
