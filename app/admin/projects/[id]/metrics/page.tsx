"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useProjects } from "@/hooks/use-projects"
import { AdminOnly } from "@/components/auth/route-guard"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Target, Timer, Clock, CheckCircle, AlertTriangle, Calendar, Users } from "lucide-react"
import Link from "next/link"

export default function ProjectMetricsPage() {
  const params = useParams()
  const projectId = params.id as string
  const { projects, loading } = useProjects()
  
  const project = projects.find(p => p.id === projectId)

  // Calcular horas reales desde time_entries
  const [calculatedHours, setCalculatedHours] = useState<Record<string, number>>({})

  useEffect(() => {
    const calculateAllHours = async () => {
      if (!project) return
      
      const hoursMap: Record<string, number> = {}
      
      for (const task of project.projectTasks) {
        if (task.taskId) {
          try {
            const { data: timeEntries, error } = await supabase
              .from('time_entries')
              .select('hours')
              .eq('task_id', task.taskId)

            if (error) {
              console.error('Error fetching time entries:', error)
              hoursMap[task.id] = 0
              continue
            }

            const totalHours = timeEntries?.reduce((sum, entry) => sum + parseFloat(entry.hours || 0), 0) || 0
            hoursMap[task.id] = totalHours
          } catch (err) {
            console.error('Error calculating hours for task:', task.id, err)
            hoursMap[task.id] = 0
          }
        } else {
          hoursMap[task.id] = 0
        }
      }
      
      setCalculatedHours(hoursMap)
    }

    if (project && project.projectTasks.length > 0) {
      calculateAllHours()
    }
  }, [project])

  // Función para determinar el color de eficiencia
  const getEfficiencyColor = (actualHours: number, estimatedHours: number) => {
    if (actualHours <= estimatedHours) return 'text-green-600' // Terminó antes o a tiempo
    return 'text-red-600'                                      // Terminó después del estimado
  }

  const getEfficiencyBgColor = (actualHours: number, estimatedHours: number) => {
    if (actualHours <= estimatedHours) return 'bg-green-100' // Terminó antes o a tiempo
    return 'bg-red-100'                                      // Terminó después del estimado
  }

  // Función para formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Función para obtener el color del estado
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

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "planning":
        return "Planificación"
      case "paused":
        return "Pausado"
      case "completed":
        return "Completado"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Proyecto no encontrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              El proyecto que buscas no existe o no tienes permisos para verlo
            </p>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Calcular métricas del proyecto
  const totalTasks = project.projectTasks.length
  const completedTasks = project.projectTasks.filter((pt: any) => pt.status === 'completed').length
  const inProgressTasks = project.projectTasks.filter((pt: any) => pt.status === 'in_progress').length
  const pendingTasks = project.projectTasks.filter((pt: any) => pt.status === 'pending').length
  const totalOperarios = project.projectOperarios.length
  
  // Calcular horas totales estimadas y trabajadas
  const estimatedHours = project.projectTasks.reduce((sum: number, pt: any) => 
    sum + (pt.task?.estimatedHours || 0), 0
  )
  const actualHours = Object.values(calculatedHours).reduce((sum: number, hours: number) => 
    sum + hours, 0
  )

  // Calcular progreso de tiempo estimado y eficiencia real
  const completedEstimatedHours = project.projectTasks
    .filter((pt: any) => pt.status === 'completed')
    .reduce((sum: number, pt: any) => sum + (pt.task?.estimatedHours || 0), 0)
  
  const completedActualHours = project.projectTasks
    .filter((pt: any) => pt.status === 'completed')
    .reduce((sum: number, pt: any) => sum + (calculatedHours[pt.id] || 0), 0)

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">Métricas detalladas del proyecto</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
            <Badge variant="outline">{getStatusText(project.status)}</Badge>
          </div>
        </div>

        {/* Resumen del proyecto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resumen del Proyecto
            </CardTitle>
            <CardDescription>
              Métricas generales y progreso del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métricas generales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalTasks}</div>
                <div className="text-sm text-muted-foreground">Total Tareas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                <div className="text-sm text-muted-foreground">Completadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
                <div className="text-sm text-muted-foreground">En Progreso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{pendingTasks}</div>
                <div className="text-sm text-muted-foreground">Pendientes</div>
              </div>
            </div>

            {/* Barras de progreso del proyecto */}
            <div className="space-y-4">
              {/* Progreso de Tareas */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Progreso de Tareas
                  </span>
                  <span className="font-semibold">
                    {totalTasks > 0 
                      ? `${Math.round((completedTasks / totalTasks) * 100)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <Progress 
                  value={totalTasks > 0 
                    ? (completedTasks / totalTasks) * 100
                    : 0
                  } 
                  className="h-2" 
                />
              </div>

              {/* Tiempo Estimado Completado */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    Tiempo Estimado Completado
                  </span>
                  <span className="font-semibold">
                    {estimatedHours > 0 
                      ? `${completedEstimatedHours % 1 === 0 ? completedEstimatedHours : completedEstimatedHours}h de ${estimatedHours % 1 === 0 ? estimatedHours : estimatedHours}h`
                      : '0h de 0h'
                    }
                  </span>
                </div>
                <Progress 
                  value={estimatedHours > 0 
                    ? Math.min((completedEstimatedHours / estimatedHours) * 100, 100)
                    : 0
                  } 
                  className="h-2" 
                />
              </div>

              {/* Eficiencia Real */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Eficiencia Real
                  </span>
                  {completedEstimatedHours > 0 ? (
                    <div className="text-right">
                      <span className={`font-semibold ${getEfficiencyColor(completedActualHours, completedEstimatedHours)}`}>
                        {completedActualHours % 1 === 0 ? completedActualHours : completedActualHours}h de {completedEstimatedHours % 1 === 0 ? completedEstimatedHours : completedEstimatedHours}h
                      </span>
                      <div className={`text-xs px-2 py-1 rounded-full ${getEfficiencyBgColor(completedActualHours, completedEstimatedHours)} ${getEfficiencyColor(completedActualHours, completedEstimatedHours)}`}>
                        {(() => {
                          const efficiency = (completedActualHours / completedEstimatedHours) * 100
                          const diff = completedActualHours - completedEstimatedHours
                          if (diff <= 0) {
                            const diffFormatted = Math.abs(diff) % 1 === 0 ? Math.abs(diff) : Math.abs(diff).toFixed(1)
                            return `${Math.round(efficiency)}% (${diffFormatted}h menos del estimado)`
                          } else {
                            const diffFormatted = diff % 1 === 0 ? diff : diff.toFixed(1)
                            return `${Math.round(efficiency)}% (${diffFormatted}h más del estimado)`
                          }
                        })()}
                      </div>
                    </div>
                  ) : (
                    <span className="font-semibold text-gray-500">Sin datos</span>
                  )}
                </div>
                {completedEstimatedHours > 0 ? (
                  <Progress 
                    value={Math.min((completedActualHours / completedEstimatedHours) * 100, 100)} 
                    className="h-2" 
                  />
                ) : (
                  <div className="h-2 bg-primary/20 rounded-full">
                  </div>
                )}
              </div>
            </div>

            {/* Información adicional */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{totalOperarios} operarios asignados</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Inicio: {formatDate(project.startDate)}</span>
              </div>
              {project.endDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Fin: {formatDate(project.endDate)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribución por operario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Distribución por Operario
            </CardTitle>
            <CardDescription>
              Resumen de tareas trabajadas por operario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                // Agrupar tareas por operario (solo las trabajadas)
                const operarioStats = project.projectTasks
                  .filter((pt: any) => pt.assignedUser) // Solo tareas trabajadas
                  .reduce((acc: any, pt: any) => {
                    const operarioName = pt.assignedUser.name
                    if (!acc[operarioName]) {
                      acc[operarioName] = {
                        name: operarioName,
                        total: 0,
                        completed: 0,
                        inProgress: 0,
                        totalHours: 0,
                        actualHours: 0
                      }
                    }
                    acc[operarioName].total++
                    acc[operarioName][pt.status]++
                    acc[operarioName].totalHours += pt.task?.estimatedHours || 0
                    acc[operarioName].actualHours += calculatedHours[pt.id] || 0
                    return acc
                  }, {})

                // Contar tareas completadas sin operario asignado
                const completedWithoutOperario = project.projectTasks.filter((pt: any) => 
                  pt.status === 'completed' && !pt.assignedUser
                ).length

                const operarioStatsArray = Object.values(operarioStats)
                
                if (operarioStatsArray.length === 0 && completedWithoutOperario === 0) {
                  return (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No hay operarios trabajando</h3>
                      <p className="text-muted-foreground">
                        Ningún operario ha tomado tareas de este proyecto aún
                      </p>
                    </div>
                  )
                }

                return (
                  <>
                    {operarioStatsArray.map((stats: any) => (
                      <div key={stats.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                            {stats.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium">{stats.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {stats.total} tareas • {stats.totalHours % 1 === 0 ? stats.totalHours : stats.totalHours}h estimadas
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {stats.completed} completadas
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {stats.inProgress} en progreso
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {completedWithoutOperario > 0 && (
                      <div className="flex items-center justify-between p-3 border rounded-lg border-orange-200 bg-orange-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            ⚠️
                          </div>
                          <div>
                            <h4 className="font-medium text-orange-800">Tareas completadas sin operario</h4>
                            <p className="text-sm text-orange-600">
                              {completedWithoutOperario} tareas completadas sin asignar a operario
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                          {completedWithoutOperario} sin asignar
                        </Badge>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Métricas por tarea */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Métricas por Tarea
            </CardTitle>
            <CardDescription>
              Progreso detallado de cada tarea del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.projectTasks
                .sort((a: any, b: any) => {
                  const statusOrder = { completed: 0, in_progress: 1, pending: 2, cancelled: 3 }
                  return statusOrder[a.status] - statusOrder[b.status]
                })
                .map((projectTask: any, index: number) => {
                const task = projectTask.task
                const actualHours = calculatedHours[projectTask.id] || 0
                const estimatedHours = task?.estimatedHours || 0
                const progressPercentage = projectTask.progressPercentage || 0
                
                return (
                  <div key={projectTask.id} className="border rounded-lg p-3 space-y-2">
                    {/* Header compacto con numeración */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <h3 className="font-semibold text-sm">{task?.title || 'Tarea sin título'}</h3>
                        <Badge variant={projectTask.status === 'completed' ? 'default' : projectTask.status === 'in_progress' ? 'secondary' : 'outline'} className="text-xs">
                          {projectTask.status === 'completed' ? 'Completada' : 
                           projectTask.status === 'in_progress' ? 'En Progreso' : 
                           projectTask.status === 'pending' ? 'Pendiente' : 
                           projectTask.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {estimatedHours % 1 === 0 ? estimatedHours : estimatedHours}h estimadas
                      </div>
                    </div>

                    {/* Información compacta */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Progreso */}
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Progreso:</span>
                        <span className="font-semibold">
                          {projectTask.status === 'completed' ? '100%' : 
                           projectTask.status === 'in_progress' ? `${progressPercentage}%` : 
                           projectTask.status === 'pending' ? '0%' : 
                           '0%'}
                        </span>
                      </div>

                      {/* Tiempo trabajado */}
                      <div className="flex items-center gap-1">
                        <Timer className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Trabajado:</span>
                        <span className="font-semibold">
                          {actualHours % 1 === 0 ? actualHours : actualHours}h
                        </span>
                      </div>

                      {/* Operario asignado */}
                      <div className="flex items-center gap-1 col-span-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Operario:</span>
                        {projectTask.assignedUser ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {projectTask.assignedUser.name}
                            </Badge>
                            {projectTask.assignedAt && (
                              <span className="text-xs text-muted-foreground">
                                ({formatDate(projectTask.assignedAt)})
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Sin asignar
                          </Badge>
                        )}
                      </div>

                      {/* Eficiencia (solo para completadas) */}
                      {projectTask.status === 'completed' && (
                        <div className="flex items-center gap-1 col-span-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Eficiencia:</span>
                          <span className={`font-semibold ${getEfficiencyColor(actualHours, estimatedHours)}`}>
                            {actualHours % 1 === 0 ? actualHours : actualHours}h de {estimatedHours % 1 === 0 ? estimatedHours : estimatedHours}h
                          </span>
                          <Badge variant="outline" className={`text-xs ${getEfficiencyColor(actualHours, estimatedHours)} border-current`}>
                            {(() => {
                              const diff = estimatedHours - actualHours
                              if (diff >= 0) {
                                const diffFormatted = diff % 1 === 0 ? diff : diff.toFixed(1)
                                return `Tiempo ahorrado: ${diffFormatted}h`
                              } else {
                                const diffFormatted = Math.abs(diff) % 1 === 0 ? Math.abs(diff) : Math.abs(diff).toFixed(1)
                                return `Tiempo extra: ${diffFormatted}h`
                              }
                            })()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
