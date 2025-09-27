"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Plus, Clock, TrendingUp, Mail, Wrench } from "lucide-react"
import Link from "next/link"
import { useOperarios } from "@/hooks/use-operarios"
import { useState, useEffect } from "react"

export default function OperariosPage() {
  const { operarios, loading, error, getOperarioStats } = useOperarios()
  const [operarioStats, setOperarioStats] = useState<Record<string, any>>({})

  // Cargar estadísticas de cada operario
  useEffect(() => {
    const loadStats = async () => {
      const stats: Record<string, any> = {}
      for (const operario of operarios) {
        stats[operario.id!] = await getOperarioStats(operario.id!)
      }
      setOperarioStats(stats)
    }
    
    if (operarios.length > 0) {
      loadStats()
    }
  }, [operarios, getOperarioStats])

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Operarios</h1>
            <p className="text-muted-foreground">Gestión del personal y asignación de tareas</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/users">
              <Button variant="outline">
                <Wrench className="mr-2 h-4 w-4" />
                Gestionar Usuarios
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Operario
              </Button>
            </Link>
          </div>
        </div>

        {/* Admin Notice */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Panel de Administración
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Como administrador, puedes gestionar todos los usuarios del sistema desde aquí.
                </p>
                <div className="flex gap-2">
                  <Link href="/admin/users">
                    <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900">
                      <Plus className="h-3 w-3 mr-1" />
                      Crear Usuario
                    </Button>
                  </Link>
                  <Link href="/admin/users">
                    <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900">
                      <Wrench className="h-3 w-3 mr-1" />
                      Ver Todos los Usuarios
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando operarios...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-4">Error al cargar operarios: {error}</p>
              <Button onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          </div>
        )}

        {/* Operarios Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {operarios.map((operario) => {
              const stats = operarioStats[operario.id!] || { total: 0, completed: 0, inProgress: 0, pending: 0 }
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
                        {operario.department || 'Sin departamento'}
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
                      <span className="font-medium">{operario.efficiency || 0}%</span>
                    </div>
                    <Progress value={operario.efficiency || 0} className="h-2" />
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
                      {(operario.skills || []).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {(!operario.skills || operario.skills.length === 0) && (
                        <span className="text-xs text-muted-foreground">Sin habilidades asignadas</span>
                      )}
                    </div>
                  </div>

                  {/* Hours and Completion Rate */}
                  <div className="pt-2 border-t space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Horas totales
                      </span>
                      <span className="font-medium">{operario.total_hours || 0}h</span>
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
        )}

        {/* Summary Statistics */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Operarios</span>
                  <span className="text-2xl font-bold">{operarios.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Eficiencia Promedio</span>
                  <span className="text-2xl font-bold">
                    {operarios.length > 0 ? Math.round(operarios.reduce((acc, op) => acc + (op.efficiency || 0), 0) / operarios.length) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Horas Totales</span>
                  <span className="text-2xl font-bold">{operarios.reduce((acc, op) => acc + (op.total_hours || 0), 0)}h</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Departamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from(new Set(operarios.map((op) => op.department).filter(Boolean))).map((dept) => {
                  const count = operarios.filter((op) => op.department === dept).length
                  return (
                    <div key={dept} className="flex items-center justify-between">
                      <span className="text-sm">{dept}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  )
                })}
                {operarios.filter(op => !op.department).length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Sin departamento</span>
                    <Badge variant="outline">{operarios.filter(op => !op.department).length}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Carga de Trabajo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {operarios.map((operario) => {
                  const stats = operarioStats[operario.id!] || { total: 0, completed: 0, inProgress: 0, pending: 0 }
                  const activeTasks = stats.inProgress + stats.pending

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
        )}
      </div>
    </MainLayout>
  )
}
